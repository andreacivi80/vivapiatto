"""Read only WMIC rawxml from stdin; emit validated process records as JSON.

No process query, filesystem access, cleanup, or process termination occurs here.
The caller owns the query timeout and must treat every nonzero exit as unknown.
"""

import json
import re
import sys
from datetime import datetime
import xml.etree.ElementTree as ET

MAX_BYTES = 4 * 1024 * 1024
MAX_RECORDS = 4096
MAX_NODES = 50000
MAX_DEPTH = 8
MAX_COMMAND_CHARS = 32768
PROPERTY_ORDER = ("CommandLine", "CreationDate", "Name", "ParentProcessId", "ProcessId", "SessionId")
CONTEXT_ORDER = (
    "NAMESPACE", "ROLE", "IMPLEVEL", "AUTHLEVEL", "LOCALE", "PRIVILEGES",
    "TRACE", "RECORD", "INTERACTIVE", "FAILFAST", "OUTPUT", "APPEND", "USER", "AGGREGATE",
)


def require(condition, reason):
    if not condition:
        # Reasons are fixed identifiers; never echo process data or XML content.
        raise ValueError(reason)


def decode_xml(raw):
    require(isinstance(raw, bytes) and 0 < len(raw) <= MAX_BYTES, "input-budget")
    require(not raw.startswith((b"\xff\xfe\x00\x00", b"\x00\x00\xfe\xff")), "encoding")
    if raw.startswith(b"\xff\xfe"):
        encoding, text = "utf-16le", raw[2:].decode("utf-16le", "strict")
    elif raw.startswith(b"\xfe\xff"):
        encoding, text = "utf-16be", raw[2:].decode("utf-16be", "strict")
    elif b"\x00" in raw[:128]:
        candidates = []
        for candidate in ("utf-16le", "utf-16be"):
            try:
                decoded = raw.decode(candidate, "strict")
                if decoded.lstrip().startswith("<") and "\x00" not in decoded:
                    candidates.append((candidate, decoded))
            except UnicodeError:
                pass
        require(len(candidates) == 1, "encoding")
        encoding, text = candidates[0]
    else:
        encoding, text = "utf-8", raw.decode("utf-8-sig", "strict")
    require("\x00" not in text and "\ufffd" not in text, "encoding")
    # No declarations, DTD, ENTITY, CDATA, comments, or non-XML processing
    # instructions are needed by the observed fixed WMIC rawxml schema.
    require("<!" not in text and not re.search(r"<\?(?!xml(?:\s|\?))", text, re.I), "declaration")
    declaration = re.match(r"<\?xml\s+([^?]+)\?>", text)
    if declaration:
        version = re.search(r"\bversion\s*=\s*['\"]([^'\"]+)['\"]", declaration[1])
        require(version is not None and version[1] == "1.0", "xml-version")
        declared = re.search(r"\bencoding\s*=\s*['\"]([^'\"]+)['\"]", declaration[1])
        if declared:
            label = declared[1].lower()
            require(label in ("utf-8", "utf-16", "utf-16le", "utf-16be"), "encoding")
            require(label == encoding or label == "utf-16" and encoding.startswith("utf-16"), "encoding")
    return text


def parse_tree(text):
    parser = ET.XMLPullParser(events=("start", "end"))
    root, count, depth = None, 0, 0
    for offset in range(0, len(text), 16384):
        parser.feed(text[offset:offset + 16384])
        for event, element in parser.read_events():
            if event == "start":
                count += 1
                depth += 1
                require(count <= MAX_NODES and depth <= MAX_DEPTH, "tree-budget")
                if root is None:
                    root = element
            else:
                depth -= 1
    parser.close()
    require(root is not None and depth == 0, "xml-incomplete")
    return root


def children(element, tags, attributes=()):
    require(set(element.attrib) == set(attributes), "attributes")
    require(not (element.text or "").strip(), "container-text")
    require(tuple(child.tag for child in element) == tuple(tags), "structure")
    require(all(not (child.tail or "").strip() for child in element), "container-tail")
    return list(element)


def leaf(element):
    require(not element.attrib and len(element) == 0, "leaf-structure")
    return element.text or ""


def uint32(text):
    require(re.fullmatch(r"0|[1-9][0-9]{0,9}", text) is not None, "pid-format")
    value = int(text)
    require(value <= 4294967295, "pid-range")
    return value


def creation_date(text):
    if text is None:
        return None
    require(re.fullmatch(r"[0-9]{14}\.[0-9]{6}[+-][0-9]{3}", text) is not None, "creation-date")
    # Wildcard/partial DMTF dates cannot support a process identity comparison.
    datetime.strptime(text[:21], "%Y%m%d%H%M%S.%f")
    return text


def parse_wmi_xml(raw):
    root = parse_tree(decode_xml(raw))
    require(root.tag == "COMMAND" and not (root.tail or "").strip(), "root")
    request, results = children(
        root, ("REQUEST", "RESULTS"),
        ("EVERYCOUNT", "ISSUEDFROM", "SEQUENCENUM", "STARTTIME"),
    )
    command, components, context = children(request, ("COMMANDLINE", "COMMANDLINECOMPONENTS", "CONTEXT"))
    leaf(command)
    node_list, = children(components, ("NODELIST",))
    node, = children(node_list, ("NODE",))
    requested_node = leaf(node)
    require(bool(requested_node), "request-node")
    for entry in children(context, CONTEXT_ORDER):
        leaf(entry)
    cim, = children(results, ("CIM",), ("NODE",))
    require(results.attrib["NODE"].casefold() == requested_node.casefold(), "result-node")
    require(not cim.attrib and not (cim.text or "").strip(), "cim")
    instances = list(cim)
    require(0 < len(instances) <= MAX_RECORDS, "record-budget")
    require(all(entry.tag == "INSTANCE" and not (entry.tail or "").strip() for entry in instances), "record-structure")
    records, seen = [], set()
    for instance in instances:
        properties = children(instance, ("PROPERTY",) * len(PROPERTY_ORDER), ("CLASSNAME",))
        require(instance.attrib["CLASSNAME"] == "Win32_Process", "class")
        values = {}
        for prop, name in zip(properties, PROPERTY_ORDER):
            require(set(prop.attrib) in ({"NAME", "TYPE"}, {"NAME", "TYPE", "PROPAGATED"}), "property-attributes")
            require(prop.attrib["NAME"] == name, "property-order")
            expected_type = "datetime" if name == "CreationDate" else "string" if name in ("CommandLine", "Name") else "uint32"
            require(prop.attrib["TYPE"] == expected_type, "property-type")
            require(prop.attrib.get("PROPAGATED", "false") in ("true", "false"), "property-propagated")
            require(not (prop.text or "").strip(), "property-text")
            require(len(prop) <= 1 and all(child.tag == "VALUE" for child in prop), "property-value")
            require(all(not (child.tail or "").strip() for child in prop), "property-tail")
            require(name in ("CommandLine", "CreationDate", "SessionId") or len(prop) == 1, "missing-value")
            values[name] = leaf(prop[0]) if len(prop) == 1 else None
        name = values["Name"]
        require(0 < len(name) <= 260 and name == name.strip(), "name")
        require(re.search(r'[\x00-\x1f\\/:*?"<>|]', name) is None, "name")
        command_line = values["CommandLine"] if values["CommandLine"] is not None else ""
        require(len(command_line) <= MAX_COMMAND_CHARS, "command-budget")
        pid = uint32(values["ProcessId"])
        parent_pid = uint32(values["ParentProcessId"])
        require(pid not in seen, "duplicate-pid")
        seen.add(pid)
        records.append({
            "name": name, "commandLine": command_line, "pid": pid, "parentPid": parent_pid,
            "creationDate": creation_date(values["CreationDate"]),
            "sessionId": uint32(values["SessionId"]) if values["SessionId"] is not None else None,
        })
    # Every instance is accounted for, and no data-looking instance/property is
    # permitted in metadata or an unknown wrapper by the strict shape above.
    require(sum(1 for element in root.iter("INSTANCE")) == len(records), "hidden-instance")
    require(sum(1 for element in root.iter("PROPERTY")) == len(records) * len(PROPERTY_ORDER), "hidden-property")
    return records


def main():
    try:
        require(len(sys.argv) == 1, "arguments")
        records = parse_wmi_xml(sys.stdin.buffer.read(MAX_BYTES + 1))
        encoded = json.dumps(records, ensure_ascii=True, separators=(",", ":")).encode("ascii")
        require(len(encoded) <= MAX_BYTES, "output-budget")
        sys.stdout.buffer.write(encoded)
        return 0
    except Exception:
        # Do not include exception text: parser errors can contain process data.
        sys.stderr.buffer.write(b"WMI_XML_UNKNOWN\n")
        return 2


if __name__ == "__main__":
    sys.exit(main())
