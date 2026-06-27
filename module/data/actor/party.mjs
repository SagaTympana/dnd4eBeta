/* Based on Draw Steel's simple Party actor, licensed under the MIT license

/**
 * @import Actor4e from "../../documents/actor.mjs";
 * @import TokenDocument4e from "../../documents/token.mjs";
 */

const { HTMLField } = foundry.data.fields;

export default class PartyData extends foundry.abstract.TypeDataModel {
	/** @inheritdoc */
	static get metadata() {
		return foundry.utils.mergeObject(super.metadata, {
			type: "party",
		});
	}

	/* -------------------------------------------------- */

	/**
	 * The Actor subtypes allowed as members of a party.
	 * @type {Set<string>}
	 */
	static ALLOWED_ACTOR_TYPES = new Set(["Player Character"]);

	/* -------------------------------------------------- */

	/** @override */
	static defineSchema() {
		return {
			description: new HTMLField({ initial: "" }),
			members: new dnd4e.data.actor.fields.MembersField(),
		};
	}

	/* -------------------------------------------------- */

	/** @inheritdoc */
	async _preCreate(data, options, user) {
		if ((await super._preCreate(data, options, user)) === false) return false;

		const update = foundry.utils.mergeObject({
			prototypeToken: {
				actorLink: true,
				disposition: CONST.TOKEN_DISPOSITIONS.FRIENDLY,
				sight: {
					enabled: false,
				},
			},
		}, data, { insertKeys: false, insertValues: false });

		this.parent.updateSource(update);
	}

	/* -------------------------------------------------- */

	/**
	 * Is a given actor valid to be a member of a party?
	 * @param {Actor4e} actor
	 * @returns {boolean}
	 */
	static validMember(actor) {
		return (actor instanceof foundry.documents.Actor) && PartyData.ALLOWED_ACTOR_TYPES.has(actor.type)
	  && !actor.inCompendium && !actor.isToken;
	}

	/* -------------------------------------------------- */

	/**
	 * Add members to the party.
	 * @param {Actor4e[]} [actors]    The actors to add.
	 * @returns {Promise<Actor4e>}    A promise that resolves to the updated party actor.
	 */
	async addMembers(actors = []) {
		actors = new Set(actors.filter(this.constructor.validMember)).filter(actor => !this.members.has(actor.id));
		const ids = [...this.members.keys(), ...actors.map(a => a.id)];
		const update = Object.entries(this.toObject().members).reduce((acc, [id, src]) => {
			if (ids.includes(id)) acc[id] = src;
			return acc;
		}, {});
		ids.forEach(id => update[id] = {});
		await this.parent.update({ "system.members": _replace(update) });
		return this.parent;
	}

	/* -------------------------------------------------- */

	/**
	 * Remove members from the party.
	 * @param {Actor4e[]} [actors]    The actors to remove.
	 * @returns {Promise<Actor4e>}    A promise that resolves to the updated party actor.
	 */
	async removeMembers(actors = []) {
		const update = {};
		const members = this.members;
		actors.forEach(actor => {
			if (members.has(actor.id)) update[actor.id] = _del;
		});
		await this.parent.update({ "system.members": update });
		return this.parent;
	}

	/* -------------------------------------------------- */

	/**
	 * Place down the members of this party.
	 * @returns {Promise<TokenDocument4e[]>}    A promise that resolves to the created tokens.
	 */
	async placeMembers() {
		if (!canvas?.scene) {
			const msg = _loc("DRAW_STEEL.Actor.party.NoScene");
			ui.notifications.error(msg, { console: false });
			throw new Error(msg);
		}

		const tokenPromises = this.members.map(m => m.actor.getTokenDocument({}, { parent: canvas.scene }));
		const createData = await Promise.all(tokenPromises);
		return canvas.tokens.placeTokens(createData.map(t => t.toObject()));
	}

	/* -------------------------------------------------- */

	/**
	 * Calls a short rest for the party.
	 */
	async shortRest() {
		for (const actor of this.members) {
			await actor.shortRest();
			/**
			 * A hook event that fires when the rest process is completed for a group.
			 * @function dnd4e.partyShortRestCompleted
			 * @memberof hookEvents
			 * @param {Actor4e} group                         The group that just completed resting.
			 */
			Hooks.callAll("dnd4e.partyShortRestCompleted", this.parent);
		}
	}

	/* -------------------------------------------------- */

	/**
	 * Calls an extended rest for the party.
	 */
	async extendedRest() {
		for (const actor of this.members) {
			await actor.extendedRest();
			/**
			 * A hook event that fires when the rest process is completed for a group.
			 * @function dnd4e.partyExtendedRestCompleted
			 * @memberof hookEvents
			 * @param {Actor4e} group                         The group that just completed resting.
			 */
			Hooks.callAll("dnd4e.partyExtendedRestCompleted", this.parent);
		}
	}
}
