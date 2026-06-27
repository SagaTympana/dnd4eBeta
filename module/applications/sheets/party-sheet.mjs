/* Based on Draw Steel's simple Party actor, licensed under the MIT license

/**
 * @import Actor4e from "../../documents/actor.mjs";
 */

/**
 * An implementation of an actor sheet for Party actors.
 */
export default class ActorSheet4eParty extends foundry.applications.api.HandlebarsApplicationMixin(foundry.applications.sheets.ActorSheetV2) {
	/** @inheritdoc */
	static DEFAULT_OPTIONS = {
		actions: {
			placeMembers: ActorSheet4eParty.#placeMembers,
			removeMember: ActorSheet4eParty.#removeMember,
			showMember: ActorSheet4eParty.#showMember,
			promptRestShort: ActorSheet4eParty.#promptRestShort,
			promptRestExtended: ActorSheet4eParty.#promptRestExtended,
		},
		classes: ["party"],
	};

	/* -------------------------------------------------- */

	/** @inheritdoc */
	static PARTS = {
		header: {
			template: "", 
		},
		navigation: {
			template: "templates/generic/tab-navigation.hbs",
		},
		members: {
			template: "", // TODO Party Sheet members tab
			classes: ["tab"],
			scrollable: [".contents"],
		},
		details: {
			template: "", // TODO Party Sheet members tab
			classes: ["tab"],
			scrollable: [".contents"],
		},
	};

	/* -------------------------------------------------- */

	/** @inheritdoc */
	static TABS = {
		primary: {
			tabs: [
				{ id: "members", label: "DND4E.Sheet.Members" },
				{ id: "details", label: "DND4E.Sheet.Description" },
			],
			initial: "members",
		},
	};

	/* -------------------------------------------------- */

	/**
	 * External actors who re-render this application.
	 * @type {Set<Actor4e>}
	 */
	#appActors = new Set();

	/* -------------------------------------------------- */

	/** @inheritdoc */
	async _prepareContext(options) {
		const context = await super._prepareContext(options);

		context.header = await this.#prepareHeader();
		context.members = await this.#prepareMembers();
		context.details = await this.#prepareDetails();

		return context;
	}

	/* -------------------------------------------------- */

	/**
	 * Prepare details context.
	 * @returns {Promise<object>}
	 */
	async #prepareDetails() {
		const value = this.document.system._source.description;
		const enriched = await foundry.applications.ux.TextEditor.implementation.enrichHTML(value, { relativeTo: this.document });
		return {
			isOwner: this.document.isOwner,
			description: { value, enriched },
		};
	}

	/* -------------------------------------------------- */

	/**
	 * Prepare header context.
	 * @returns {Promise<object>}
	 */
	async #prepareHeader() {
		const members = this.document.system.members;
		return {
			canPlaceMembers: game.user.isGM && canvas?.ready && members.size,
		};
	}

	/* -------------------------------------------------- */

	/**
	 * Prepare members context.
	 * @returns {Promise<object[]>}
	 */
	async #prepareMembers() {
		const members = [];
		for (const member of this.document.system.members) {
			const ctx = { ...member };
			const { recoveries, stamina } = member.actor.system;
			Object.assign(ctx, {
				recoveries, stamina,
				rootId: [this.id, member.actor.id].join("-"),
				canView: member.actor.testUserPermission(game.user, "OBSERVER"),
			});
			members.push(ctx);
		}
		return members.sort((a, b) => a.actor._source.name.localeCompare(b.actor._source.name));
	}

	/* -------------------------------------------------- */

	/** @inheritdoc */
	async _onRender(context, options) {
		await super._onRender(context, options);
		for (const actor of this.#appActors) delete actor.apps[this.id];
		this.#appActors.clear();
		for (const { actor } of this.document.system.members) {
			actor.apps[this.id] = this;
			this.#appActors.add(actor);
		}
	}

	/* -------------------------------------------------- */

	/** @inheritdoc */
	async _onClose(options) {
		for (const actor of this.#appActors) delete actor.apps[this.id];
		this.#appActors.clear();
		return super._onClose(options);
	}

	/* -------------------------------------------------- */

	/** @inheritdoc */
	async _onDropActor(event, actor) {
		await this.document.system.addMembers([actor]);
		return true;
	}

	/* -------------------------------------------------- */

	/**
	 * @this PartySheet4e
	 * @param {PointerEvent} event    The initiating click event.
	 * @param {HTMLElement} target    The capturing html element that defined the [data-action].
	 */
	static async #placeMembers(event, target) {
		if (!this.document.system.members.size) return;
		const isMaximized = this.rendered && !this.minimized;
		if (isMaximized) await this.minimize();
		await this.document.system.placeMembers();
		if (isMaximized) this.maximize();
	}

	/* -------------------------------------------------- */

	/**
	 * @this PartySheet4e
	 * @param {PointerEvent} event    The initiating click event.
	 * @param {HTMLElement} target    The capturing html element that defined the [data-action].
	 */
	static #removeMember(event, target) {
		const id = target.closest("[data-member-id]").dataset.memberId;
		const actor = game.actors.get(id);
		this.document.system.removeMembers([actor]);
	}

	/* -------------------------------------------------- */

	/**
	 * @this PartySheet4e
	 * @param {PointerEvent} event    The initiating click event.
	 * @param {HTMLElement} target    The capturing html element that defined the [data-action].
	 */
	static #showMember(event, target) {
		const id = target.closest("[data-member-id]").dataset.memberId;
		const actor = game.actors.get(id);
		actor.sheet.render({ force: true });
	}

	/* -------------------------------------------------- */

	/**
	 * @this PartySheet4e
	 * @param {PointerEvent} event    The initiating click event.
	 * @param {HTMLElement} target    The capturing html element that defined the [data-action].
	 */
	static async #promptRestShort(event, target) {
		if (!this.document.system.members.size) return;
		if (!game.user.isGM) return;
		await this.document.system.shortRest();
	}

	/* -------------------------------------------------- */

	/**
	 * @this PartySheet4e
	 * @param {PointerEvent} event    The initiating click event.
	 * @param {HTMLElement} target    The capturing html element that defined the [data-action].
	 */
	static async #promptRestExtended(event, target) {
		if (!this.document.system.members.size) return;
		if (!game.user.isGM) return;
		await this.document.system.extendedRest();
	}
}
