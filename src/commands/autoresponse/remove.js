const util = require('../../util.js');

/**
 * remove an auto-response
 * @param {module:"discord.js".Collection}  responses
 * @param {module:"discord.js".Message}     message
 * @param {String[]}                        args
 * @returns {Promise<void>}
 */
module.exports = async (responses, message, args) => {
    if (!args.length) {
        await message.channel.send("Provide the id of the autoresponse you want to remove");
        return;
    }
    let response = responses.get(parseInt(args.shift()));
    if (!response) {
        await message.channel.send("Invalid id!");
        return;
    }

    let confirmation = await message.channel.send("Do you really want to delete this autoresponse?", response.embed("Remove autoresponse", util.color.red));
    {
        let yes = confirmation.react(util.icons.yes);
        let no = confirmation.react(util.icons.no);
        await Promise.all([yes,no]);
    }

    let confirmed;
    try {
        confirmed = (await confirmation.awaitReactions((reaction, user) => {
            return user.id === message.author.id && (reaction.emoji.name === util.icons.yes || reaction.emoji.name === util.icons.no);
        }, { max: 1, time: 15000, errors: ['time'] })).first().emoji.name === util.icons.yes;
    }
    catch {
        return await message.channel.send("You took to long to react!");
    }
    if (!confirmed) {
        return await message.channel.send("Canceled!");
    }

    await response.remove();

    await message.channel.send(`Removed the autoresponse with the id ${response.id}!`);
};
