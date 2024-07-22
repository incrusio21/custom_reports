# Copyright (c) 2024, DAS and contributors
# For license information, please see license.txt
import json

import frappe
from frappe.model.document import Document


class CustomReport(Document):
	
	def validate(self):
		self.disabled_other_custom()

	def disabled_other_custom(self):
		if not self.enabled:
			return
		
		frappe.db.set_value("Custom Report", {"name": ["!=", self.name]}, "enabled", 0)

	@frappe.whitelist()
	def get_custom_report_type_detail(self):
		if not self.report_type:
			frappe.throw("Select Report Type first")
		
		return json.dumps(
			frappe.get_list("Custom Report Type Detail",
				pluck="type_name",
				filters={"parenttype": "Custom Report Type", "parent": self.report_type}
			)
		)