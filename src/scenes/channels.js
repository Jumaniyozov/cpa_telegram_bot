const Scene = require('telegraf/scenes/base');
const {Telegraf} = require('telegraf');
const {Extra} = Telegraf;

const _ = require('lodash');

const Channels = require('../models/Channels');

module.exports.myChannels = (bot, I18n) => {
    const myChannelsScene = new Scene('myChannels');

    myChannelsScene.enter(async (ctx) => {

        const channels = await Channels.findAll({
            where: {
                user_id: ctx.from.id
            }
        })

        let channelsMrkp = [];

        try {
            if (!_.isEmpty(channels)) {
                channels.forEach(channel => {
                    channelsMrkp.push([channel.dataValues.channelName]);
                })
            } else {
                return ctx.scene.enter('mainMenu', {
                    start: ctx.i18n.t('channelsEmpty')
                })
            }

            if (channelsMrkp.length === 0) {
                return ctx.scene.enter('mainMenu', {
                    start: `${ctx.i18n.t('channelsEmpty')}`
                })
            } else {
                ctx.reply(ctx.i18n.t('menuEnterMyChannels'), Extra.markup(markup => {
                    return markup.keyboard([...channelsMrkp, [ctx.i18n.t('menuBack')]]).resize();
                }))
            }
        } catch (err) {
            console.error(err.message);
            return ctx.scene.enter('mainMenu', {
                start: ctx.i18n.t('generalErrorMsg')
            })
        }
    });

    myChannelsScene.hears(I18n.match('menuBack'), ctx => {
        return ctx.scene.enter('mainMenu', {
            start: ctx.i18n.t('mainMenu')
        })
    })

    return myChannelsScene
}

module.exports.addChannel = (bot, I18n) => {
    const addChannelScene = new Scene('addChannel');

    addChannelScene.enter(async (ctx) => {
        ctx.reply(ctx.i18n.t('menuEnterAddChannel'), Extra.markup(markup => {
            return markup.keyboard([[ctx.i18n.t('menuAddChannel')], [ctx.i18n.t('menuDeleteChannel')], [ctx.i18n.t('menuBack')]]).resize();
        }))

    });

    addChannelScene.hears(I18n.match('menuAddChannel'), ctx => {
        return ctx.scene.enter('addChannelConfirm');
    })
    addChannelScene.hears(I18n.match('menuDeleteChannel'), ctx => {
        return ctx.scene.enter('deleteChannelConfirm');
    })

    addChannelScene.hears(I18n.match('menuBack'), ctx => {
        return ctx.scene.enter('mainMenu', {
            start: ctx.i18n.t('mainMenu')
        })
    })

    return addChannelScene
}


module.exports.addChannelConfirm = (bot, I18n) => {
    const addChannelConfirmScene = new Scene('addChannelConfirm');

    addChannelConfirmScene.enter(async (ctx) => {
        ctx.replyWithHTML(ctx.i18n.t('menuAddChannelInst'), Extra.markup(markup => {
            return markup.keyboard([[ctx.i18n.t('menuBack')], [ctx.i18n.t('menuMainBack')]]).resize();
        }))

    });


    addChannelConfirmScene.hears(I18n.match('menuBack'), ctx => {
        return ctx.scene.enter('addChannel')
    })

    addChannelConfirmScene.hears(I18n.match('menuMainBack'), ctx => {
        return ctx.scene.enter('mainMenu', {
            start: ctx.i18n.t('mainMenu')
        })
    })

    addChannelConfirmScene.on('message', async ctx => {
        // console.log(ctx.message);
        if (!_.isEmpty(ctx.message.forward_from_chat)) {
            const channelName = ctx.message.forward_from_chat.title;
            const adminList = await bot.telegram.getChatAdministrators(ctx.message.forward_from_chat.id);
            const found = adminList.find(user => {
                return user.user.username === 'mannagee_bot'
            })

            if (found) {
                const channel = await Channels.findOne({where: {user_id: ctx.from.id, channelName: channelName}});
                if (channel) {
                    ctx.reply(ctx.i18n.t('channelExistsForUser'));
                } else {
                    Channels.create({
                        user_id: ctx.from.id,
                        username: ctx.from.username,
                        channelName: channelName
                    })
                    return ctx.scene.enter('mainMenu', {
                        start: ctx.i18n.t('channelAddedSuccessfully')
                    })
                }
            } else {
                ctx.reply(ctx.i18n.t('notAdminMessage'));
            }
        } else {
            ctx.reply(ctx.i18n.t('notAdminMessage'));
        }
    })


    return addChannelConfirmScene
}


module.exports.deleteChannelConfirm = (bot, I18n) => {
    const deleteChannelConfirmScene = new Scene('deleteChannelConfirm');

    deleteChannelConfirmScene.enter(async (ctx) => {

        const channels = await Channels.findAll({
            where: {
                user_id: ctx.from.id
            }
        })

        if (!_.isEmpty(channels)) {
            ctx.session.channelsDeleteArr = channels.map(channel => [channel.dataValues.channelName]);
        } else {
            return ctx.scene.enter('mainMenu', {
                start: ctx.i18n.t('channelsEmpty')
            })
        }


        ctx.replyWithHTML(ctx.i18n.t('menuEnterDeleteChannel'), Extra.markup(markup => {
            return markup.keyboard([...ctx.session.channelsDeleteArr, [ctx.i18n.t('menuBack')], [ctx.i18n.t('menuMainBack')]]).resize();
        }))

    });


    deleteChannelConfirmScene.hears(I18n.match('menuBack'), ctx => {
        return ctx.scene.enter('addChannel')
    })

    deleteChannelConfirmScene.hears(I18n.match('menuMainBack'), ctx => {
        return ctx.scene.enter('mainMenu', {
            start: ctx.i18n.t('mainMenu')
        })
    })

    deleteChannelConfirmScene.on('text', async ctx => {
        // console.log(ctx.message);
        if (ctx.session.channelsDeleteArr.flat(2).includes(ctx.message.text)) {
            try {
                await Channels.destroy({
                    where: {
                        user_id: ctx.from.id,
                        channelName: ctx.message.text
                    }
                })

                return ctx.scene.enter('mainMenu', {
                    start: ctx.i18n.t('channelDeletedSuccessfully')
                })

            } catch (err) {
                console.error(err.message);
                return ctx.scene.enter('mainMenu', {
                    start: ctx.i18n.t('generalErrorMsg')
                })
            }

        }
    })


    return deleteChannelConfirmScene
}

