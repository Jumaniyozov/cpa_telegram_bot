const Scene = require('telegraf/scenes/base');
const {Telegraf} = require('telegraf');
const {Extra} = Telegraf;

const _ = require('lodash');


const Analytics = require('../models/Analytics');
const Offers = require('../models/Offers');

module.exports.myCabinet = (bot, I18n) => {
    const myCabinet = new Scene('myCabinet');

    myCabinet.enter(async (ctx) => {

        const channelsSet = new Set();
        ctx.session.channelObj = {};
        let retMrkp;

        try {
            const refUser = await Analytics.findAll({
                where: {
                    referralUserId: ctx.from.id
                }
            })
            if (!_.isEmpty(refUser)) {
                const refData = refUser.forEach(ref => {
                    if (channelsSet.has(`${ref.dataValues.referralChannel}:${ref.dataValues.offer_id}`)) {
                        ctx.session.channelObj[`${ref.dataValues.referralChannel}:${ref.dataValues.offer_id}`] += 1;
                    } else {
                        channelsSet.add(`${ref.dataValues.referralChannel}:${ref.dataValues.offer_id}`);
                        ctx.session.channelObj[`${ref.dataValues.referralChannel}:${ref.dataValues.offer_id}`] = 1;
                    }
                })
                let channelObjs = new Set();
                Array.from(channelsSet).forEach(c => channelObjs.add(c.split(':')[0]));
                retMrkp = Array.from(channelObjs).map(c => [c]);
                ctx.session.refChannelsMrkp = retMrkp.flat();
            }
        } catch (err) {
            console.error(err.message);
        }

        ctx.reply(`${ctx.i18n.t('menuEnterCabinet')}`, Extra.markup(markup => {
            return markup.keyboard([
                retMrkp ? retMrkp.flat() : [],
                [`${ctx.i18n.t('menuBack')}`]
            ]).resize();
        }))

        // const channels = await Channels.findAll({
        //     where: {
        //         user_id: ctx.from.id
        //     }
        // })
        //
        // let channelsMrkp = [];
        //
        // try {
        //     if (!_.isEmpty(channels)) {
        //         channels.forEach(channel => {
        //             channelsMrkp.push([channel.dataValues.channelName]);
        //         })
        //     }
        //
        //     if (channelsMrkp.length === 0) {
        //         return ctx.scene.enter('mainMenu', {
        //             start: `${ctx.i18n.t('channelsEmpty')}`
        //         })
        //     } else {
        //         ctx.reply(ctx.i18n.t('menuEnterMyChannels'), Extra.markup(markup => {
        //             return markup.keyboard([...channelsMrkp, [ctx.i18n.t('menuBack')]]).resize();
        //         }))
        //     }
        // } catch (err) {
        //     console.error(err.message);
        //     ctx.scene.enter('mainMenu', {
        //         start: ctx.i18n.t('generalErrorMsg')
        //     })
        // }
    });

    myCabinet.hears(I18n.match('menuBack'), ctx => {
        ctx.scene.enter('mainMenu', {
            start: ctx.i18n.t('mainMenu')
        })
    })

    myCabinet.on('text', async ctx => {
        if (ctx.session.refChannelsMrkp.includes(ctx.message.text)) {
            const offerSet = new Set();
            const channelSet = new Set();

            const offer = {};

            for (let [key, value] of Object.entries(ctx.session.channelObj)) {
                offerSet.add(key.split(':')[1]);
                channelSet.add(key.split(':')[0]);
            }
            ctx.session.referralOffersArr = Array.from(offerSet);

            ctx.session.referralChannel = ctx.message.text;

            ctx.scene.enter('myCabinetOffer')


        }
    })

    return myCabinet
}

module.exports.myCabinetOfferScene = (bot, I18n) => {
    const myCabinetOfferScene = new Scene('myCabinetOffer');

    myCabinetOfferScene.enter(async (ctx) => {
        const offers = await Offers.findAll();

        const offerSet = new Set();

        ctx.session.referralOffersArr.forEach(id => {
            offers.forEach(offer => {
                if (offer.dataValues.id === +id) {
                    if (ctx.session.chosenLanguage === 'ru') {
                        offerSet.add(offer.dataValues.offerRu)
                    } else {
                        offerSet.add(offer.dataValues.offerUz)
                    }
                }
            })
        })

        ctx.session.offerRefArr = Array.from(offerSet).map(c => [c]);


        ctx.reply(`${ctx.i18n.t('menuCabinetOfferReferal')}`, Extra.markup(markup => {
            return markup.keyboard([
                ...ctx.session.offerRefArr,
                [`${ctx.i18n.t('menuBack')}`],
                [`${ctx.i18n.t('menuMainBack')}`]
            ]).resize();
        }))
    });

    myCabinetOfferScene.hears(I18n.match('menuBack'), ctx => {
        ctx.scene.enter('myCabinet')
    });

    myCabinetOfferScene.hears(I18n.match('menuMainBack'), ctx => {
        ctx.scene.enter('mainMenu', {
            start: ctx.i18n.t('mainMenu')
        })
    })

    myCabinetOfferScene.on('text', async ctx => {
            let data = {};
            if (ctx.session.offerRefArr.flat(2).includes(ctx.message.text)) {
                if (ctx.session.chosenLanguage === 'ru') {
                    data['offers'] = await Offers.findOne({where: {offerRu: ctx.message.text}});
                } else {
                    data['offers'] = await Offers.findOne({where: {offerUz: ctx.message.text}});
                }

                const analyt = await Analytics.findAll({
                    where: {
                        offer_id: data.offers.id,
                        referralUserId: ctx.from.id,
                        referralChannel: ctx.session.referralChannel
                    }
                });

                let userMessage = `${ctx.i18n.t('channelReferralUserUsed')}: ${analyt.length}`;

                ctx.reply(`${userMessage}`);
            }
        }
    )

    return myCabinetOfferScene
}
