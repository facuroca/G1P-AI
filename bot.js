require('dotenv/config');
const { Client } = require('discord.js');
const { OpenAI } = require('openai');


const client = new Client({ intents: ['Guilds', 'GuildMembers', 'GuildMessages', 'MessageContent'] });

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

const CHANNELS = ['1263584163659911270']

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, 
    });

client.on('messageCreate', async message => {
    if(message.author.bot) return;
    if(!CHANNELS.includes(message.channelId) && !message.mentions.users.has(client.user.id)) return;

    await message.channel.sendTyping();

    const sendTypingInterval = setInterval(() => {  
        message.channel.sendTyping();
    }, 5000);

    let conversation = [];
    conversation.push({ role: 'system', content: 'G1P AI es un capo de la IA' });

    let previousMessages = await message.channel.messages.fetch({ limit: 10 });
    previousMessages.reverse();

    previousMessages.forEach(msg => {
        if(msg.author.bot && msg.author.id !== client.user.id) return;
        const username = msg.author.username.replace(/\s+/g, '_').replace(/[^\w\s]/gi, '');

        if(msg.author.id === client.user.id) {
            conversation.push({ role: 'assistant', name: username, content: msg.content });
        } else {
            conversation.push({ role: 'user', name: username, content: msg.content });
        }
    });

    const response = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: conversation,
    }).catch((error) =>  console.error('OPENAI Error: \n', error))

    clearInterval(sendTypingInterval);

    if(!response) {
        message.reply('No pude responder a tu mensaje, por favor intenta de nuevo');
        return;
    }

    const responseMessage = response.choices[0].message.content;
    const chunkSizeLimit = 2000;
    for(let i = 0; i < responseMessage.length; i += chunkSizeLimit) {
        const chunk = responseMessage.substring(i, i + chunkSizeLimit);
        await message.reply(chunk);
    }
 });

client.login(process.env.DISCORD_BOT_TOKEN);