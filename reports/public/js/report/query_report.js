frappe.provide("reports.query_reports");

$.extend(frappe.views.QueryReport.prototype, {
	get_report_settings() {
		return new Promise((resolve, reject) => {
			if (frappe.query_reports[this.report_name]) {
				this.report_settings = frappe.query_reports[this.report_name];
				resolve();
			} else {
				frappe
					.xcall("frappe.desk.query_report.get_script", {
						report_name: this.report_name,
					})
					.then((settings) => {
						frappe.dom.eval(settings.script || "");
						frappe.after_ajax(() => {
							this.report_settings = this.get_local_report_settings(
								settings.custom_report_name
							);
							this.report_settings.html_format = settings.html_format;
							this.report_settings.execution_time = settings.execution_time || 0;
							this.report_settings.custom_reports = settings.custom_reports;
							frappe.query_reports[this.report_name] = this.report_settings;

							if (this.report_doc.filters && !this.report_settings.filters) {
								// add configured filters
								this.report_settings.filters = this.report_doc.filters;
							}

							resolve();
						});
					})
					.catch(reject);
			}
		});
	},
    render_datatable() {
        let data = this.data;
		let columns = this.columns.filter((col) => !col.hidden);

		if (data.length > 1000000) {
			let msg = __(
				"This report contains {0} rows and is too big to display in browser, you can {1} this report instead.",
				[cstr(format_number(data.length, null, 0)).bold(), __("export").bold()]
			);

			this.toggle_message(true, `${frappe.utils.icon("solid-warning")} ${msg}`);
			return;
		}

        this.$report.show();
		
		if(!this.report_settings.custom_reports){
			this.load_datatable(data, columns);
		}else{
			
			reports.query_reports[this.report_settings.custom_reports].run(
				this.$report[0], 
				data,
				columns,
				this.report_settings.get_datatable_options
			)
		}		
    },
	load_datatable(data, columns){
		if (
			this.datatable &&
			this.datatable.options &&
			this.datatable.options.showTotalRow === this.raw_data.add_total_row
		) {
			this.datatable.options.treeView = this.tree_report;
			this.datatable.refresh(data, columns);
		} else {
			let datatable_options = {
				columns: columns,
				data: data,
				inlineFilters: true,
				language: frappe.boot.lang,
				translations: frappe.utils.datatable.get_translations(),
				treeView: this.tree_report,
				layout: "fixed",
				cellHeight: 33,
				showTotalRow: this.raw_data.add_total_row && !this.report_settings.tree,
				direction: frappe.utils.is_rtl() ? "rtl" : "ltr",
				hooks: {
					columnTotal: frappe.utils.report_column_total,
				},
			};

			if (this.report_settings.get_datatable_options) {
				datatable_options = this.report_settings.get_datatable_options(datatable_options);
			}
			this.datatable = new window.DataTable(this.$report[0], datatable_options);
		}

		if (typeof this.report_settings.initial_depth == "number") {
			this.datatable.rowmanager.setTreeDepth(this.report_settings.initial_depth);
		}
		if (this.report_settings.after_datatable_render) {
			this.report_settings.after_datatable_render(this.datatable);
		}
	}
})