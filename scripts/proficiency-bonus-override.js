const moduleID = 'proficiency-bonus-override';

const lg = x => console.log(x);


Hooks.on('renderActorSheet5eCharacter2', (app, [html], appData) => {
    if (app._mode === 1 || !game.user.isGM) return;

    const { actor } = app;
    const proficiencyDiv = html.querySelector('div.lozenges').lastElementChild;
    proficiencyDiv.addEventListener('click', () => pbOverrideDialog(actor));

    const effectsSection = html.querySelector('section.items-list.effects-list');
    effectsSection.querySelectorAll('li.item.effect').forEach(e => hideOverrideEffect(actor, e));
});

Hooks.on('renderActorSheet5eNPC', (app, [html], appData) => {
    if (!game.user.isGM) return;

    const { actor } = app;
    const profDiv = html.querySelector('div.proficiency');
    profDiv.addEventListener('click', () => pbOverrideDialog(actor));

    html.querySelectorAll('li.effect').forEach(e => hideOverrideEffect(actor, e));
});


function pbOverrideDialog(actor) {
    new Dialog({
        title: "Proficiency Bonus Override",
        content: `
            Leave blank to remove override.
            <input type="number" value="${actor.getFlag(moduleID, 'pbOverride')}" />
            <br>
        `,
        buttons: {
            confirm: {
                label: "Confirm",
                callback: async ([html]) => {
                    const input = html.querySelector('input');
                    const value = input.value ? Number(input.value) : null;
                    const pbOverrideEffect = actor.effects.find(e => e.flags[moduleID]?.pbOverride === true);
                    if (value === null) {
                        await actor.unsetFlag(moduleID, 'pbOverride');
                        if (pbOverrideEffect) return pbOverrideEffect.delete();
                    }
                    else {
                        await actor.setFlag(moduleID, 'pbOverride', value);
                        if (pbOverrideEffect) await pbOverrideEffect.update({
                            changes: [{
                                key: "system.attributes.prof",
                                mode: 5,
                                value
                            }]
                        });
                        else {
                            await actor.createEmbeddedDocuments('ActiveEffect', [{
                                name: moduleID,
                                flags: {
                                    [moduleID]: { pbOverride: true }
                                },
                                img: "icons/svg/aura.svg",
                                changes: [{
                                    key: "system.attributes.prof",
                                    mode: 5,
                                    value
                                }]
                            }]);
                        }
                    }
                }
            },
            cancel: {
                label: "Cancel",
                callback: () => { }
            }
        },
        default: "confirm"
    }, { width: 400 }).render(true);
}

function hideOverrideEffect(actor, e) {
    const effect = actor.effects.get(e.dataset.effectId);
    if (effect?.getFlag(moduleID, 'pbOverride')) return e.remove();
}
