import logger from './Logger.js';
import {exists, readJSON} from '../util/fsutils.js';

/**
 * @typedef {Object} ConfigData
 * @property {string} authToken
 * @property {DatabaseConfig} database
 * @property {?string} googleApiKey
 * @property {?GoogleCloudConfig} googleCloud
 * @property {{enabled: boolean, guild: string}} debug
 * @property {string[]} featureWhitelist
 * @property {Emojis} emoji emoji ids
 */

/**
 * @typedef {Object} GoogleCloudConfig
 * @property {GoogleCloudCredentials} credentials
 * @property {CloudLoggingConfig} logging
 * @property {VisionConfig} vision
 */

/**
 * @typedef {Object} DatabaseConfig
 */

/**
 * @typedef {Object} VisionConfig
 * @property {boolean} enabled
 */

/**
 * @typedef {Object} CloudLoggingConfig google cloud monitoring
 * @property {boolean} enabled
 * @property {string} projectId
 * @property {string} logName
 */

/**
 * @typedef {Object} GoogleCloudCredentials
 * @property {string} client_email
 * @property {string} private_key
 */

/**
 * @typedef {Object} Emojis
 * @property {?string} source
 * @property {?string} privacy
 * @property {?string} invite
 * @property {?string} discord
 * @property {?string} youtube
 * @property {?string} zendesk
 * @property {?string} firstPage
 * @property {?string} previousPage
 * @property {?string} refresh
 * @property {?string} nextPage
 * @property {?string} lastPage
 * @property {?string} announcement
 * @property {?string} channel
 * @property {?string} forum
 * @property {?string} stage
 * @property {?string} thread
 * @property {?string} voice
 * @property {?string} avatar
 * @property {?string} ban
 * @property {?string} moderations
 * @property {?string} mute
 * @property {?string} pardon
 * @property {?string} strike
 * @property {?string} kick
 * @property {?string} userCreated
 * @property {?string} userId
 * @property {?string} userJoined
 */

export class Config {
    /**
     * @type {ConfigData}
     */
    #data;

    /**
     * @return {ConfigData}
     */
    get data() {
        return this.#data;
    }

    async load() {
        if (process.env.Argus_USE_ENV) {
            let googleCloudCredentials = process.env.Argus_GOOGLE_CLOUD_CREDENTIALS;
            if (googleCloudCredentials) {
                googleCloudCredentials = JSON.parse((new Buffer(googleCloudCredentials, 'base64')).toString());
            }
            else {
                googleCloudCredentials = {
                    client_email: process.env.Argus_GOOGLE_CLOUD_CREDENTIALS_CLIENT_EMAIL,
                    private_key: process.env.Argus_GOOGLE_CLOUD_CREDENTIALS_PRIVATE_KEY?.replaceAll('\\n', '\n'),
                };
            }


            // load settings from env
            this.#data = {
                authToken: process.env.Argus_AUTH_TOKEN,
                database: {
                    host: process.env.Argus_DATABASE_HOST,
                    user: process.env.Argus_DATABASE_USER ?? 'Argus',
                    password: process.env.Argus_DATABASE_PASSWORD,
                    database: process.env.Argus_DATABASE_DATABASE ?? 'Argus',
                    port: parseInt(process.env.Argus_DATABASE_PORT ?? '3306'),
                },
                googleApiKey:  process.env.Argus_GOOGLE_API_KEY,
                googleCloud: {
                    credentials: googleCloudCredentials,
                    vision: {
                        enabled: this.#parseBooleanFromEnv(process.env.Argus_GOOGLE_CLOUD_VISION_ENABLED)
                    },
                    logging: {
                        enabled: this.#parseBooleanFromEnv(process.env.Argus_GOOGLE_CLOUD_LOGGING_ENABLED),
                        projectId: process.env.Argus_GOOGLE_CLOUD_LOGGING_PROJECT_ID,
                        logName: process.env.Argus_GOOGLE_CLOUD_LOGGING_LOG_NAME,
                    },
                },
                featureWhitelist: (process.env.Argus_FEATURE_WHITELIST ?? '').split(/ *, */),
                emoji: {
                    source: process.env.Argus_EMOJI_SOURCE,
                    privacy: process.env.Argus_EMOJI_PRIVACY,
                    invite: process.env.Argus_EMOJI_INVITE,
                    discord: process.env.Argus_EMOJI_DISCORD,
                    youtube: process.env.Argus_EMOJI_YOUTUBE,
                    zendesk: process.env.Argus_EMOJI_ZENDESK,
                    firstPage: process.env.Argus_EMOJI_FIRST_PAGE,
                    previousPage: process.env.Argus_EMOJI_PREVIOUS_PAGE,
                    refresh: process.env.Argus_EMOJI_REFRESH,
                    nextPage: process.env.Argus_EMOJI_NEXT_PAGE,
                    lastPage: process.env.Argus_EMOJI_LAST_PAGE,
                    announcement: process.env.Argus_EMOJI_ANNOUNCEMENT,
                    channel: process.env.Argus_EMOJI_CHANNEL,
                    forum: process.env.Argus_EMOJI_FORUM,
                    stage: process.env.Argus_EMOJI_STAGE,
                    thread: process.env.Argus_EMOJI_THREAD,
                    voice: process.env.Argus_EMOJI_VOICE,
                    avatar: process.env.Argus_EMOJI_AVATAR,
                    ban: process.env.Argus_EMOJI_BAN,
                    moderations: process.env.Argus_EMOJI_MODERATIONS,
                    mute: process.env.Argus_EMOJI_MUTE,
                    pardon: process.env.Argus_EMOJI_PARDON,
                    strike: process.env.Argus_EMOJI_STRIKE,
                    kick: process.env.Argus_EMOJI_KICK,
                    userCreated: process.env.Argus_EMOJI_USER_CREATED,
                    userId: process.env.Argus_EMOJI_USER_ID,
                    userJoined: process.env.Argus_EMOJI_USER_JOINED,
                }
            };
        }
        else {
            // load settings from file
            if (!await exists('./config.json')) {
                await logger.error('No settings file found.\n' +
                    'Create a config.json or use environment variables as described in the CONFIGURATION.md');
                process.exit(1);
            }

            this.#data = await readJSON('./config.json');
            this.#data.googleCloud ??= {
                vision: {
                    enabled: false
                },
                logging: {
                    enabled: false,
                    projectId: '',
                    logName: '',
                },
                credentials: {
                    client_email: '',
                    private_key: '',
                },
            };
            this.#data.emoji ??= {};
            this.#data.featureWhitelist ??= [];
        }
    }

    /**
     * parse an environment variable as a boolean
     * @param {string} string
     * @return {boolean}
     */
    #parseBooleanFromEnv(string) {
        return ['1', 'true', 'y'].includes(string?.toLowerCase?.());
    }
}

export default new Config();
