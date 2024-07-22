# Copyright (c) 2024, DAS and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document


class CustomReportType(Document):
	pass
	# def validate(self):
	# 	self.duplicate_type_name()

	# def duplicate_type_name(self):
	# 	type_name = []
	# 	for row in self.details:
	# 		if row.type_name in type_name:
	# 			frappe.throw("Type Name {} already used".format(row.type_name))

	# 		type_name.append(row.type_name)