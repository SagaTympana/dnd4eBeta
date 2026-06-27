/**
 * @import Actor4e from "../actor.mjs";
 */

/**
 * Simplistic extension of Collection to allow splitting contents by type.
 * @extends {foundry.utils.Collection<string, { actor: Actor4e }>}
 */
export default class MembersCollection extends foundry.utils.Collection {
	/**
     * The actors in the party.
     * @type {Collection<string, DrawSteelActor>}
     */
	get actors() {
		return this.reduce((acc, { actor }) => acc.set(actor.id, actor), new foundry.utils.Collection());
	}

	/* -------------------------------------------------- */

	/**
   * Cached members by type.
   * @type {Record<string, Actor4e[]>|void}
   */
	#documentsByType;

	/* -------------------------------------------------- */

	/**
   * The members by type.
   * @type {Record<string, Actor4e[]>}
   */
	get documentsByType() {
		if (!this.#documentsByType) {
			this.#documentsByType = Object.groupBy(this, m => m.actor.type);
			dnd4e.data.Actor.PartyData.ALLOWED_ACTOR_TYPES.forEach(key => this.#documentsByType[key] ??= []);
		}
		return this.#documentsByType;
	}
}
