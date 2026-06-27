import DocumentSheet4e from "../sheets/DocumentSheet4e.mjs";

export default class ExtendedRestDialog extends DocumentSheet4e {

	static DEFAULT_OPTIONS = {
		id: "long-rest",
		classes: ["dnd4e", "actor-rest", "standard-form", "default"],
		form: {
			closeOnSubmit: true,
			handler: ExtendedRestDialog.#onSubmit,
		},
		position: {
			width: 500,
			height: "auto",
		},
		window: {
			contentClasses: ["standard-form"],
			resizable: true,
		},
		tag: "form",
	};
	
	get title() {
		return `${this.document.name} - ${_loc("DND4E.ExtendedRest")}`;
	}

	static PARTS = {
		ExtendedRestDialog: {
			template: "systems/dnd4e/templates/apps/extended-rest.hbs",
		},
		footer: {
			template: "templates/generic/form-footer.hbs",
		},
	};

	/** @override */
	async _prepareContext(options) {
		const context = await super._prepareContext(options);
		foundry.utils.mergeObject(context, {
			system: this.document.system,
			buttons: [
				{ type: "submit", label: "DND4E.ExtendedRestTake" },
			],
		});
		return context;
	}
	
	static async #onSubmit(event, form, formData) {
		this.document.extendedRest(event, {
			...this.options,
			...{ envi: formData.object.envi },
		});
	}

}
