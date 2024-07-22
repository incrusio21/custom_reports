# Copyright (c) 2024, DAS and Contributors
# License: MIT. See LICENSE

import os

import frappe
import frappe.desk.reportview
from frappe import _, get_site_path
from frappe.model.utils import render_include
from frappe.modules import get_module_path, scrub
from frappe.utils import get_html_format
from frappe.utils.jinja_globals import bundled_asset

from frappe.desk.query_report import get_report_doc

@frappe.whitelist()
def get_script(report_name):
    report = get_report_doc(report_name)
    module = report.module or frappe.db.get_value("DocType", report.ref_doctype, "module")

    is_custom_module = frappe.get_cached_value("Module Def", module, "custom")

    # custom modules are virtual modules those exists in DB but not in disk.
    module_path = "" if is_custom_module else get_module_path(module)
    report_folder = module_path and os.path.join(module_path, "report", scrub(report.name))
    script_path = report_folder and os.path.join(report_folder, scrub(report.name) + ".js")
    print_path = report_folder and os.path.join(report_folder, scrub(report.name) + ".html")

    script = None
    custom_script = None
    custom_name = None
    custom_bundle = frappe.db.get_value("Custom Report", {"report": report_name, "enabled": 1}, ["report_type", "bundle_js"], as_dict=1)
    if custom_bundle and custom_bundle.bundle_js:
        custom_name = custom_bundle.report_type
        custom_path = "." + bundled_asset(custom_bundle.bundle_js)
        if os.path.exists(custom_path):
            with open(custom_path) as f:
                custom_script = f.read() 
                custom_script += f"\n\n//# sourceURL={custom_bundle}.js"

    if os.path.exists(script_path):
        with open(script_path) as f:
            script = f.read()
            script += f"\n\n//# sourceURL={scrub(report.name)}.js"

    html_format = get_html_format(print_path)

    if not script and report.javascript:
        script = report.javascript
        script += f"\n\n//# sourceURL={scrub(report.name)}__custom"

    if not script:
        script = "frappe.query_reports['%s']={}" % report_name

    if custom_script:
        script = custom_script + "\n\n" + script

    return {
        "script": render_include(script),
        "html_format": html_format,
        "execution_time": frappe.cache.hget("report_execution_time", report_name) or 0,
        "filters": report.filters,
        "custom_report_name": report.name if report.get("is_custom_report") else None,
        "custom_reports": custom_name
    }