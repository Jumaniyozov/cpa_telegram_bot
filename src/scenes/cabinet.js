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
        let retMrkp = [];

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
                ...retMrkp,
                [`${ctx.i18n.t('menuBack')}`]
            ]).resize();
        }))
    });

    myCabinet.hears(I18n.match('menuBack'), ctx => {
        ctx.scene.enter('mainMenu', {
            start: ctx.i18n.t('mainMenu')
        })
    })

    myCabinet.on('text', async ctx => {
        if (ctx.session.refChannelsMrkp.includes(ctx.message.text)) {


            const offerToSend = {};
            const offers = await Offers.findAll();

            const listOffers = {};
            const listqwer = [];

            let message = '';

            try {
                for (let [key, value] of Object.entries(ctx.session.channelObj)) {
                    if (key.split(':')[0] === ctx.message.text) {
                        listqwer.push({id: +`${key.split(':')[1]}`, value});
                        offerToSend[`${key.split(':')[0]}`] = listqwer;
                    }
                }

                if(!_.isEmpty(offerToSend)) {
                    message += `${ctx.i18n.t('cabinetForOfferChannel', {channelName: Object.keys(offerToSend)[0]})}\n\n`;
                    Object.values(offerToSend).flat().forEach(offer =>{
                        offers.forEach(off => {
                            if(off.dataValues.id === offer.id) {
                                listOffers[`${off.dataValues.offerRu}`] = offer.value;
                            }
                        })
                    })

                    for (let [key, value] of Object.entries(listOffers)) {
                        message += `${ctx.i18n.t('cabinetForOfferOffer', {key, value})}\n`;
                    }

                    ctx.replyWithHTML(message);
                }

            } catch (err) {
                console.log(err);
                return ctx.scene.enter('mainMenu', {
                    start: ctx.i18n.t('generalErrorMsg')
                })
            }


            // const offerSet = new Set();
            // const channelSet = new Set();
            // for (let [key, value] of Object.entries(ctx.session.channelObj)) {
            //     offerSet.add(key.split(':')[1]);
            //     channelSet.add(key.split(':')[0]);
            // }
            // ctx.session.referralOffersArr = Array.from(offerSet);

            // ctx.session.referralChannel = ctx.message.text;

            // ctx.scene.enter('myCabinetOffer')

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
