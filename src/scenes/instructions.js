const Scene = require('telegraf/scenes/base');
const {Telegraf} = require('telegraf');
const {Extra} = Telegraf;

const Instructions = require('./../models/Instructions');

module.exports = (bot, I18n) => {
    const instructionsScene = new Scene('instructions');

    instructionsScene.enter(async (ctx) => {

        const instructions = await Instructions.findAll();

        let msg = '';

        if (ctx.session.chosenLanguage === 'ru') {
            let indexx = 1;
            const msgRply = instructions.forEach((instruction, index) => {
                msg += `⁉️ ${indexx}. ${instruction.dataValues.instructionRu}\n`;
                indexx++;
            });
        } else {
            const msgRply = instructions.forEach((instruction, index) => {
                msg += `⁉️ ${indexx}. ${instruction.dataValues.instructionUz}\n`;
                indexx++;
            });
        }

        ctx.reply(msg, Extra.markup(markup => {
            return markup.keyboard([
                [`${ctx.i18n.t('menuBack')}`]
            ]).resize();
        }))
    });

    instructionsScene.hears(I18n.match('menuBack'), ctx => {
        ctx.scene.enter('mainMenu', {
            start: ctx.i18n.t('mainMenu')
        })
    })


    return instructionsScene
}
