import Gantt from "devextreme/ui/gantt";

// Expose DataTable globally to allow customizations.
window.Gantt = Gantt;

frappe.provide("reports.query_reports");

reports.query_reports["Devextreme Gantt"] = {
    run(element, data, column, options){       
        this.required_libs = ["/assets/reports/css/notokufiarabic.css", "dx-gantt.bundle.css"]
        this.element = element

        gantt_column = column.map((v) => ({
            dataField: v.fieldname,
            caption: v.label,
            width: v.width,
        }))

        let gantt_option = {
            height: "550px",
            tasks: {
                dataSource: data,
            },
            resources: {
                dataSource: data.resources,
            },
            resourceAssignments: {
                dataSource: data.resourceAssignments,
            },
            toolbar: {
                items: [
                    'collapseAll',
                    'expandAll',
                    'separator',
                    'zoomIn',
                    'zoomOut',
                ],
            },
            columns: gantt_column,
            scaleTypeRange: {
                min: 'days',
                max: 'years'
            },
            scaleType: 'month',
            taskListWidth: 600,
        }

        if(options){
            gantt_option = options(gantt_option)
        }

        frappe.run_serially([
            () => this.load_lib(),
            () => new window.Gantt(this.element, gantt_option),
        ])
    
    },
    async load_lib(callback) {
		await frappe.require(this.required_libs, callback);
	}
}