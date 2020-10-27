require('dotenv').config()
const {Telegraf} = require('telegraf');
const path = require('path');
const I18n = require('telegraf-i18n');
const MySQLSession = require('telegraf-session-mysql');
const Stage = require('telegraf/stage');

const _ = require('lodash');

const i18n = new I18n({
    directory: path.resolve(__dirname, 'locales'),
    defaultLanguage: 'ru',
    sessionName: 'session',
    useSession: true
})

const session = new MySQLSession({
    host: process.env.DBHOST,
    user: process.env.DBUSER,
    password: process.env.DBPASS,
    database: process.env.DBNAME
})


const bot = new Telegraf(process.env.TGTOKEN)

// Scenes
const languageScene = require('./src/scenes/language')();

const mainScene = require('./src/scenes/main')(bot, I18n);
const instructionsScene = require('./src/scenes/instructions')(bot, I18n);
const ChannelsScene = require('./src/scenes/channels');
const myChannelsScene = ChannelsScene.myChannels(bot, I18n);
const addChannelScene = ChannelsScene.addChannel(bot, I18n);
const addChannelConfirmScene = ChannelsScene.addChannelConfirm(bot, I18n);
const deleteChannelConfirmScene = ChannelsScene.deleteChannelConfirm(bot, I18n);
const offersScene = require('./src/scenes/offers');
const partnerEnterScene = offersScene.partnersScene(bot, I18n);
const offersEnterScene = offersScene.offersScene(bot, I18n);
const offersCreateReferalScene = offersScene.offersCreateReferalScene(bot, I18n);
const myCabinetScene = require('./src/scenes/cabinet');
const myCabinetEnterScene = myCabinetScene.myCabinet(bot, I18n);
const myCabinetOfferScene = myCabinetScene.myCabinetOfferScene(bot, I18n);

const stgs = [mainScene, languageScene, instructionsScene, myChannelsScene, partnerEnterScene, deleteChannelConfirmScene,
    offersEnterScene, offersCreateReferalScene, myCabinetOfferScene, addChannelScene, addChannelConfirmScene, myCabinetEnterScene];

// Stage
const stage = new Stage();
let queue = new Map()
stage.use((ctx, next) => {
    if (ctx.message && ctx.message.photo) return next()
    let user = queue.get(ctx.from.id)
    if (user) return
    queue.set(ctx.from.id, true)
    return next().then(() => {
        queue.delete(ctx.from.id)
    }).catch(e => {
        console.error(e)
        queue.delete(ctx.from.id)
    })
})


// middlewares
bot.use(session.middleware())
bot.use(i18n.middleware())

// Referrals and Start

const Analytics = require('./src/models/Analytics');

stage.hears(/\/start (.+)|\/start/i, async function (ctx) {
    console.log(ctx.match);
    try {
        if (ctx.match[1] !== undefined) {
            try {
                const [refId, refChannelName, offer_id] = ctx.match[1].split('_-_');
                const refUser = await Analytics.findOne({
                    where: {
                        user_id: ctx.from.id,
                        referralChannel: refChannelName
                    }
                })
                if (refUser) {
                    ctx.reply(`${ctx.i18n.t('channelReferralUnsuccess')}`);
                    ctx.session.mesage_filter = [];
                    ctx.scene.enter('language');
                } else {
                    Analytics.create({
                        user_id: ctx.from.id,
                        username: ctx.from.username,
                        referralUserId: refId,
                        referralChannel: refChannelName,
                        offer_id: offer_id
                    })
                    ctx.reply(`${ctx.i18n.t('channelReferralSuccess')}`);
                    ctx.session.mesage_filter = [];
                    ctx.scene.enter('language');
                }

            } catch (err) {
                console.error(err.message);
                if (!_.isEmpty(ctx.session.chosenLanguage)) {
                    ctx.session.mesage_filter = [];
                    return ctx.scene.enter('mainMenu', {
                        start: ctx.i18n.t('generalErrorMsg')
                    })
                }
            }
        } else {
            if (!_.isEmpty(ctx.session.chosenLanguage)) {
                ctx.session.mesage_filter = [];
                return ctx.scene.enter('mainMenu', {
                    start: ctx.i18n.t('mainMenu')
                })
            }
            return ctx.scene.enter('language');
        }
    } catch (err) {
        console.error(err.message);
        if (!_.isEmpty(ctx.session.chosenLanguage)) {
            ctx.session.mesage_filter = [];
            return ctx.scene.enter('mainMenu', {
                start: ctx.i18n.t('mainMenu')
            })
        }
        return ctx.scene.enter('language');
    }

    // ctx.scene.enter('language');
});

stgs.map(stg => {
    stage.register(stg);
})

bot.use(stage.middleware());


bot.catch(err => {
    console.error(err.message);
})


bot.startPolling()
