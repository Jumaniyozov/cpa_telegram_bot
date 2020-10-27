const Scene = require('telegraf/scenes/base');
const {Telegraf} = require('telegraf');
const {Extra, Markup} = Telegraf;


const _ = require('lodash');

const Partners = require('../models/Partners');
const Offers = require('../models/Offers');
const Channels = require('../models/Channels');

module.exports.partnersScene = (bot, I18n) => {
    const partnersScene = new Scene('partners');

    partnersScene.enter(async (ctx) => {

        const partners = await Partners.findAll();
        ctx.session.partnersArray = [];


        let message = ctx.i18n.t('menuEnterPartners');

        if (ctx.scene.state.start) {
            message = ctx.scene.state.start
        }

        let partnersMrkp = [];

        try {
            if (!_.isEmpty(partners)) {
                partners.forEach(partner => {
                    partnersMrkp.push([partner.dataValues.partnerName]);
                    ctx.session.partnersArray.push(partner.dataValues.partnerName);
                })
            }

            if (partnersMrkp.length === 0) {
                return ctx.scene.enter('mainMenu', {
                    start: `${ctx.i18n.t('parntersEmpty')}`
                })
            } else {
                ctx.reply(message, Extra.markup(markup => {
                    return markup.keyboard([...partnersMrkp, [ctx.i18n.t('menuBack')]]).resize();
                }))
            }
        } catch (err) {
            console.error(err.message);
            ctx.scene.enter('mainMenu', {
                start: ctx.i18n.t('generalErrorMsg')
            })
        }
    });

    partnersScene.hears(I18n.match('menuBack'), ctx => {
        ctx.scene.enter('mainMenu', {
            start: ctx.i18n.t('mainMenu')
        })
    })

    partnersScene.hears(I18n.match('menuMainBack'), ctx => {
        ctx.scene.enter('mainMenu', {
            start: ctx.i18n.t('mainMenu')
        })
    })

    partnersScene.on('text', async ctx => {
        if (ctx.session.partnersArray.includes(ctx.message.text)) {
            ctx.session.partnersName = ctx.message.text;
            ctx.scene.enter('offers');
        }
    })

    return partnersScene
}


module.exports.offersScene = (bot, I18n) => {
    const offersScene = new Scene('offers');

    offersScene.enter(async (ctx) => {
        const partner = await Partners.findOne({where: {partnerName: ctx.session.partnersName}});

        const offers = await Offers.findAll({where: {partnerId: partner.dataValues.id}});

        ctx.session.offersArray = [];
        ctx.session.offersCheckArray = [];

        const offersMrkp = [];



        if (!_.isEmpty(offers)) {
            offers.forEach(offer => {
                if (ctx.chosenLanguage === 'ru') {
                    offersMrkp.push([offer.dataValues.offerRu])
                    ctx.session.offersCheckArray.push(offer.dataValues.offerRu);
                    ctx.session.offersArray.push(offer.dataValues);
                } else {
                    offersMrkp.push([offer.dataValues.offerUz])
                    ctx.session.offersCheckArray.push(offer.dataValues.offerUz);
                    ctx.session.offersArray.push(offer.dataValues);
                }
            })
        } else {
            return ctx.scene.enter('partners', {
                start: ctx.i18n.t('parntersNoOffer')
            })
        }

        ctx.reply(ctx.i18n.t('menuEnterOffers'), Extra.markup(markup => {
            return markup.keyboard([...offersMrkp, [ctx.i18n.t('menuBack')], [ctx.i18n.t('menuMainBack')]]).resize();
        }))
    });

    offersScene.hears(I18n.match('menuBack'), ctx => {
        ctx.scene.enter('partners')
    })

    offersScene.hears(I18n.match('menuMainBack'), ctx => {
        ctx.scene.enter('mainMenu', {
            start: ctx.i18n.t('mainMenu')
        })
    })


    offersScene.on('text', async ctx => {
        let offerToReturn = {};
        if (ctx.session.offersCheckArray.includes(ctx.message.text)) {
            if (ctx.chosenLanguage === 'ru') {
                offerToReturn = ctx.session.offersArray.find(offer => offer.offerRu === ctx.message.text);
            } else {
                offerToReturn = ctx.session.offersArray.find(offer => offer.offerUz === ctx.message.text);
            }
        }

        if (!_.isEmpty(offerToReturn)) {
            ctx.session.offerToReturn = offerToReturn;
            const channels = await Channels.findAll({where: {user_id: ctx.from.id}});

            if (!_.isEmpty(channels)) {
                ctx.session.usersOfferChannels = channels.map(channel => {
                    return [channel.dataValues.channelName];
                })

                ctx.scene.enter('offersReferal');
            }
            // ctx.replyWithPhoto(`${offerToReturn.photoUrl}`, Extra.caption(`t.me/mannagee_bot?start=${ctx.from.id}_-_1qewrqrwe`));

        }
    })
    return offersScene
}


module.exports.offersCreateReferalScene = (bot, I18n) => {
    const offersCreateReferalScene = new Scene('offersReferal');

    offersCreateReferalScene.enter(async (ctx) => {
        ctx.reply(`${ctx.i18n.t('menuOffersChannelChoose')}`, Extra.markup(m => {
            return m.keyboard([...ctx.session.usersOfferChannels, [ctx.i18n.t('menuBack')], [ctx.i18n.t('menuMainBack')]]).resize();
        }));

    });

    offersCreateReferalScene.hears(I18n.match('menuBack'), ctx => {
        ctx.scene.enter('offers')
    })

    offersCreateReferalScene.hears(I18n.match('menuMainBack'), ctx => {
        ctx.scene.enter('mainMenu', {
            start: ctx.i18n.t('mainMenu')
        })
    })


    offersCreateReferalScene.on('text', async ctx => {
        if (ctx.session.usersOfferChannels.flat(2).includes(ctx.message.text)) {
            let offerCaption;
            if (ctx.session.chosenLanguage === 'ru') {
                offerCaption = `
${ctx.session.offerToReturn.descriptionRu}
            
${ctx.i18n.t('referralUrl')}:
            
t.me/mannagee_bot?start=${ctx.from.id}_-_${ctx.message.text}_-_${ctx.session.offerToReturn.id}
`;
            } else {
                offerCaption = `
${ctx.session.offerToReturn.descriptionUz}
            
${ctx.i18n.t('referralUrl')}:
            
t.me/mannagee_bot?start=${ctx.from.id}_-_${ctx.message.text}_-_${ctx.session.offerToReturn.id}
`;
            }
            await ctx.replyWithPhoto(`${ctx.session.offerToReturn.photoUrl}`, Extra.caption(offerCaption));

            return ctx.scene.enter('mainMenu', {
                start: ctx.i18n.t('referalUrlGotSuccessfully'),
            })
        }

    })

    return offersCreateReferalScene
}

