const Scene = require('telegraf/scenes/base');

const _ = require('lodash');
const Channels = require('../models/Channels');


module.exports = (bot, I18n) => {
    const mainScene = new Scene('mainMenu');

    mainScene.enter(async (ctx) => {

        const channels = await Channels.findAll({where: {user_id: ctx.from.id}});

        let message = `${ctx.i18n.t('greeting', {username: ctx.from.username})}`;

        const unauthMsg = [
            [`${ctx.i18n.t('menuMyChannels')}`, `${ctx.i18n.t('menuCabinet')}`],
            !_.isEmpty(channels) ? [`${ctx.i18n.t('menuOffers')}`, `${ctx.i18n.t('menuChannelSettings')}`] : [`${ctx.i18n.t('menuChannelSettings')}`],
            [`${ctx.i18n.t('menuInstructions')}`, `${ctx.i18n.t('menuLanguage')}`],
            [],
        ]

        if (ctx.scene.state.start) {
            message = ctx.scene.state.start
        }


        bot.telegram.sendMessage(ctx.chat.id, message, {
            parse_mode: 'HTML',
            reply_markup: {
                keyboard: unauthMsg,
                resize_keyboard: true
            }
        })

    })


    mainScene.hears(I18n.match('menuLanguage'), ctx => {
        ctx.scene.enter('language')
    })

    mainScene.hears(I18n.match('menuCabinet'), ctx => {
        ctx.scene.enter('myCabinet')
    })

    mainScene.hears(I18n.match('menuInstructions'), ctx => {
        ctx.scene.enter('instructions')
    })

    mainScene.hears(I18n.match('menuMyChannels'), ctx => {
        ctx.scene.enter('myChannels')
    })

    mainScene.hears(I18n.match('menuOffers'), ctx => {
        ctx.scene.enter('partners')
    })

    mainScene.hears(I18n.match('menuChannelSettings'), ctx => {
        ctx.scene.enter('addChannel')
    })

    mainScene.hears(I18n.match('menuBack'), ctx => {
        ctx.scene.enter('mainMenu', {
            start: ctx.i18n.t('mainMenu')
        })
    })
    return mainScene;
}
