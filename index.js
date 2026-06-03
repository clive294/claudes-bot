const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  ButtonBuilder,
  ButtonStyle,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ChannelType,
  PermissionFlagsBits,
  Events,
  AttachmentBuilder,
} = require("discord.js");
const fs = require('fs');
const path = require('path');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// ─── LOAD DASHBOARD CONFIG ──────────────────────────────────────────────────
const configPath = path.join(__dirname, 'bot_config.json');
let dashboardConfig = {};
if (fs.existsSync(configPath)) {
  dashboardConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  console.log('✅ Loaded dashboard config');
} else {
  console.log('⚠️ No bot_config.json found, using defaults');
}

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const TOKEN = process.env.DISCORD_TOKEN;
const STAFF_ROLE_ID = process.env.STAFF_ROLE_ID || null;
const TICKET_CATEGORY_ID = process.env.TICKET_CATEGORY_ID || null;
const WELCOME_CHANNEL_ID = "1510395267495755886";
const AUTO_ROLE_ID = "1510275196576207051";
const LOG_CHANNEL_ID = "1510701776310108360";
const OWNER_ROLE_ID = "1510275124069404924";
const MOD_ROLE_ID = "1510275193493389413";
// ─────────────────────────────────────────────────────────────────────────────

const BUILD_PING = `<@&${OWNER_ROLE_ID}>`;
const SPAWNER_PING = `<@&${OWNER_ROLE_ID}>`;

const TICKET_TYPES = {
  ticket_staff: { name: "staff-app", title: "Apply For Staff", color: 0x5865f2, ping: OWNER_ROLE_ID, emoji: "👔" },
  ticket_builder: { name: "builder-app", title: "Apply for Builder", color: 0x57f287, ping: OWNER_ROLE_ID, emoji: "🔨" },
  ticket_giveaway: { name: "giveaway-claim", title: "Claim a Giveaway win", color: 0xfee75c, ping: OWNER_ROLE_ID, emoji: "🎁" },
  ticket_general: { name: "general", title: "General Questions", color: 0xed4245, ping: OWNER_ROLE_ID, emoji: "❓" }
};

client.once(Events.ClientReady, () => {
  console.log(`✅ Claude's Bot is online as ${client.user.tag}`);
});

// ─── WELCOME + AUTO ROLE (with dashboard config) ─────────────────────────────
client.on(Events.GuildMemberAdd, async (member) => {
  if (AUTO_ROLE_ID) {
    const role = member.guild.roles.cache.get(AUTO_ROLE_ID);
    if (role) await member.roles.add(role).catch(console.error);
  }

  if (WELCOME_CHANNEL_ID) {
    const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
    if (!channel) return;

    const welcomeConfig = dashboardConfig.welcome || {};
    const title = welcomeConfig.title || "👋 Welcome!";
    let description = welcomeConfig.description || "Welcome {member} to {server}!\nYou are member #{count}.";
    description = description
      .replace(/{server}/g, member.guild.name)
      .replace(/{member}/g, member.toString())
      .replace(/{count}/g, member.guild.memberCount);
    const color = parseInt(welcomeConfig.color?.replace('#', ''), 16) || 0x5865f2;

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .setColor(color)
      .setTimestamp()
      .setFooter({ text: "Claude's Bot" });

    await channel.send({ embeds: [embed] });
  }
});

// ─── COMMANDS ────────────────────────────────────────────────────────────────
client.on(Events.MessageCreate, async (message) => {
  if (!message.member) return;
  const isAdmin = message.member.permissions.has(PermissionFlagsBits.Administrator);
  const isStaff = STAFF_ROLE_ID && message.member.roles.cache.has(STAFF_ROLE_ID);

  // !panel (using dashboard config)
  if (message.content === "!panel" && (isAdmin || isStaff)) {
    const panelConfig = dashboardConfig.panel || {};
    const description = panelConfig.description || "Order a farm build or digout service.";
    const color = parseInt(panelConfig.color?.replace('#', ''), 16) || 0x2b2d31;

    const embed = new EmbedBuilder()
      .setTitle(panelConfig.title || "Build Services")
      .setDescription(description)
      .setColor(color)
      .setFooter({ text: "Claude's Bot • Build Services" })
      .setTimestamp();

    const farmBtn = new ButtonBuilder().setCustomId("order_farm").setLabel("🌾 Farm Order").setStyle(ButtonStyle.Primary);
    const digoutBtn = new ButtonBuilder().setCustomId("order_digout").setLabel("⛏️ Digout").setStyle(ButtonStyle.Secondary);
    await message.channel.send({ embeds: [embed], components: [new ActionRowBuilder().addComponents(farmBtn, digoutBtn)] });
    await message.delete().catch(() => {});
  }

  // !spawnerpanel (using dashboard config)
  if (message.content === "!spawnerpanel" && (isAdmin || isStaff)) {
    const spawnerConfig = dashboardConfig.spawnerpanel || {};
    const description = spawnerConfig.description || "🦴 Skeleton Spawners — 4.7M each\n🦴 Buying — 4.4M each";
    const color = parseInt(spawnerConfig.color?.replace('#', ''), 16) || 0x2b2d31;

    const embed = new EmbedBuilder()
      .setTitle(spawnerConfig.title || "Skeleton Spawner Shop")
      .setDescription(description)
      .setColor(color)
      .setFooter({ text: "Claude's Bot • Spawner Shop" })
      .setTimestamp();

    const sellBtn = new ButtonBuilder().setCustomId("sell_spawners").setLabel("💰 Sell Spawners").setStyle(ButtonStyle.Success);
    const buyBtn = new ButtonBuilder().setCustomId("buy_spawners").setLabel("🛒 Buy Spawners").setStyle(ButtonStyle.Primary);
    await message.channel.send({ embeds: [embed], components: [new ActionRowBuilder().addComponents(sellBtn, buyBtn)] });
    await message.delete().catch(() => {});
  }

  // !ticketpanel (using dashboard config)
  if (message.content === "!ticketpanel" && (isAdmin || isStaff)) {
    const ticketConfig = dashboardConfig.ticketpanel || {};
    const buttons = ticketConfig.buttons || {};
    const description = ticketConfig.description || "Click a button to create a ticket";
    const color = parseInt(ticketConfig.color?.replace('#', ''), 16) || 0x2b2d31;

    const embed = new EmbedBuilder()
      .setTitle(ticketConfig.title || "🎫 Create a ticket")
      .setDescription(description)
      .setColor(color)
      .setFooter({ text: "Ticketty | Ticket System" })
      .setTimestamp();

    const staffBtn = new ButtonBuilder().setCustomId("ticket_staff").setLabel(buttons.staff || "👔 Apply For Staff").setStyle(ButtonStyle.Secondary);
    const builderBtn = new ButtonBuilder().setCustomId("ticket_builder").setLabel(buttons.builder || "🔨 Apply for Builder").setStyle(ButtonStyle.Success);
    const giveawayBtn = new ButtonBuilder().setCustomId("ticket_giveaway").setLabel(buttons.giveaway || "🎁 Claim a Giveaway win").setStyle(ButtonStyle.Primary);
    const generalBtn = new ButtonBuilder().setCustomId("ticket_general").setLabel(buttons.general || "❓ General Questions").setStyle(ButtonStyle.Danger);

    const row1 = new ActionRowBuilder().addComponents(staffBtn, builderBtn);
    const row2 = new ActionRowBuilder().addComponents(giveawayBtn, generalBtn);

    await message.channel.send({ embeds: [embed], components: [row1, row2] });
    await message.delete().catch(() => {});
  }

  // !reload command to refresh dashboard config without restart
  if (message.content === "!reload" && isAdmin) {
    if (fs.existsSync(configPath)) {
      dashboardConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      await message.reply("✅ Dashboard config reloaded!");
    } else {
      await message.reply("❌ No bot_config.json found");
    }
  }

  // !addstaff @user
  if (message.content.startsWith("!addstaff") && isAdmin) {
    const target = message.mentions.members.first();
    if (!target || !STAFF_ROLE_ID) return message.reply("❌ Mention a user and make sure STAFF_ROLE_ID is set.");
    await target.roles.add(STAFF_ROLE_ID);
    await message.reply({ content: `✅ Added staff role to ${target}.`, allowedMentions: { repliedUser: false } });
  }

  // !removestaff @user
  if (message.content.startsWith("!removestaff") && isAdmin) {
    const target = message.mentions.members.first();
    if (!target || !STAFF_ROLE_ID) return message.reply("❌ Mention a user and make sure STAFF_ROLE_ID is set.");
    await target.roles.remove(STAFF_ROLE_ID);
    await message.reply({ content: `✅ Removed staff role from ${target}.`, allowedMentions: { repliedUser: false } });
  }

  // !help
  if (message.content === "!help" && (isAdmin || isStaff)) {
    const embed = new EmbedBuilder()
      .setTitle("Claude's Bot — Commands")
      .setDescription([
        "**!panel** — Post the build services panel",
        "**!spawnerpanel** — Post the spawner shop panel",
        "**!ticketpanel** — Post the support ticket panel",
        "**!addstaff @user** — Give staff role to a user *(admin only)*",
        "**!removestaff @user** — Remove staff role from a user *(admin only)*",
        "**!reload** — Reload dashboard config *(admin only)*",
        "**!help** — Show this message",
      ].join("\n"))
      .setColor(0x5865f2);
    await message.reply({ embeds: [embed] });
  }
});

// ─── INTERACTIONS ─────────────────────────────────────────────────────────────
client.on(Events.InteractionCreate, async (interaction) => {

  if (interaction.isButton()) {

    if (interaction.customId === "order_farm") {
      const modal = new ModalBuilder().setCustomId("modal_farm").setTitle("🌾 Farm Order");
      modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("ign").setLabel("Your IGN").setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("farm_name").setLabel("Which farm do you want?").setStyle(TextInputStyle.Short).setPlaceholder("e.g. Mauschu Advanced").setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("extra").setLabel("Any extra info? (optional)").setStyle(TextInputStyle.Paragraph).setRequired(false))
      );
      return await interaction.showModal(modal);
    }

    if (interaction.customId === "order_digout") {
      const modal = new ModalBuilder().setCustomId("modal_digout").setTitle("⛏️ Digout Order");
      modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("ign").setLabel("Your IGN").setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("dimensions").setLabel("Dimensions (X x Y x Z)").setStyle(TextInputStyle.Short).setPlaceholder("e.g. 50 x 10 x 50").setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("extra").setLabel("Any extra info? (optional)").setStyle(TextInputStyle.Paragraph).setRequired(false))
      );
      return await interaction.showModal(modal);
    }

    if (interaction.customId === "sell_spawners" || interaction.customId === "buy_spawners") {
      const isBuy = interaction.customId === "buy_spawners";
      const modal = new ModalBuilder()
        .setCustomId(isBuy ? "modal_buy_spawners" : "modal_sell_spawners")
        .setTitle(isBuy ? "🛒 Buy Spawners" : "💰 Sell Spawners");
      modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("ign").setLabel("Your IGN").setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("amount").setLabel("How many skeleton spawners?").setStyle(TextInputStyle.Short).setPlaceholder("e.g. 100").setRequired(true))
      );
      return await interaction.showModal(modal);
    }

    // Ticket type buttons
    if (interaction.customId === "ticket_staff" || 
        interaction.customId === "ticket_builder" || 
        interaction.customId === "ticket_giveaway" || 
        interaction.customId === "ticket_general") {
      
      const type = TICKET_TYPES[interaction.customId];
      const guild = interaction.guild;
      const channelName = `${type.name}-${interaction.user.username.toLowerCase()}`;
      
      const existing = guild.channels.cache.find(c => c.name === channelName);
      if (existing) {
        return interaction.reply({ content: `❌ You already have an open ticket: ${existing}`, ephemeral: true });
      }
      
      const overwrites = [
        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles] },
        { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ReadMessageHistory] },
        { id: OWNER_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
        { id: MOD_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
      ];
      
      const ticketChannel = await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        permissionOverwrites: overwrites,
        ...(TICKET_CATEGORY_ID ? { parent: TICKET_CATEGORY_ID } : {}),
      });
      
      const ticketEmbed = new EmbedBuilder()
        .setTitle(`${type.emoji} ${type.title}`)
        .setDescription([
          `**Ticket opened by:** ${interaction.user}`,
          `**Type:** ${type.title}`,
          "",
          "Please describe your request in detail.",
          "A staff member will assist you shortly.",
        ].join("\n"))
        .setColor(type.color)
        .setTimestamp()
        .setFooter({ text: "Ticketty | Ticket System" });
      
      const closeBtn = new ButtonBuilder().setCustomId("close_ticket").setLabel("🔒 Close Ticket").setStyle(ButtonStyle.Danger);
      
      await ticketChannel.send({ 
        content: `${interaction.user} <@&${OWNER_ROLE_ID}>`,
        embeds: [ticketEmbed], 
        components: [new ActionRowBuilder().addComponents(closeBtn)] 
      });
      
      await interaction.reply({ content: `✅ Ticket created: ${ticketChannel}`, ephemeral: true });
    }

    // ── Close ticket ──────────────────────────────────────────────────────────
    if (interaction.customId === "close_ticket") {
      await interaction.reply({ content: "🔒 Saving transcript and closing in 5 seconds..." });

      const messages = await interaction.channel.messages.fetch({ limit: 100 });
      const sorted = [...messages.values()].reverse();
      
      const date = new Date();
      const dateStr = `${date.getFullYear()}-${(date.getMonth()+1).toString().padStart(2,'0')}-${date.getDate().toString().padStart(2,'0')}_${date.getHours().toString().padStart(2,'0')}-${date.getMinutes().toString().padStart(2,'0')}-${date.getSeconds().toString().padStart(2,'0')}`;
      
      let transcriptLines = [];
      transcriptLines.push(`================================================================================`);
      transcriptLines.push(`                         TICKET TRANSCRIPT`);
      transcriptLines.push(`================================================================================`);
      transcriptLines.push(`Channel:     ${interaction.channel.name}`);
      transcriptLines.push(`Server:      ${interaction.guild.name}`);
      transcriptLines.push(`Closed by:   ${interaction.user.tag} (${interaction.user.id})`);
      transcriptLines.push(`Date:        ${date.toLocaleString()}`);
      transcriptLines.push(`Messages:    ${sorted.length}`);
      transcriptLines.push(`================================================================================`);
      transcriptLines.push(``);
      
      for (const msg of sorted) {
        const timestamp = new Date(msg.createdTimestamp).toLocaleString();
        const author = msg.author.tag;
        const content = msg.content || "[embed or attachment]";
        transcriptLines.push(`[${timestamp}] ${author}:`);
        transcriptLines.push(`  ${content}`);
        transcriptLines.push(``);
      }
      
      transcriptLines.push(`================================================================================`);
      transcriptLines.push(`                      END OF TRANSCRIPT`);
      transcriptLines.push(`================================================================================`);
      
      const transcript = transcriptLines.join('\n');
      const attachment = new AttachmentBuilder(Buffer.from(transcript, "utf-8"), { name: `transcript-${interaction.channel.name}-${dateStr}.txt` });

      if (LOG_CHANNEL_ID) {
        const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);
        if (logChannel) {
          const logEmbed = new EmbedBuilder()
            .setTitle("📋 Ticket Closed")
            .setDescription(`**Channel:** ${interaction.channel.name}\n**Closed by:** ${interaction.user}\n**Messages:** ${sorted.length}`)
            .setColor(0xed4245)
            .setTimestamp();
          await logChannel.send({ embeds: [logEmbed], files: [attachment] });
        }
      }

      try {
        const userAttachment = new AttachmentBuilder(Buffer.from(transcript, "utf-8"), { name: `transcript-${interaction.channel.name}-${dateStr}.txt` });
        await interaction.user.send({ content: `📄 **Transcript for ${interaction.channel.name}**\nClosed: ${date.toLocaleString()}`, files: [userAttachment] });
      } catch {}

      setTimeout(() => interaction.channel.delete("Ticket closed").catch(console.error), 5000);
    }
  }

  // ── Modal submit ──────────────────────────────────────────────────────────
  if (interaction.isModalSubmit()) {

    // Spawner tickets
    const isBuySpawner = interaction.customId === "modal_buy_spawners";
    const isSellSpawner = interaction.customId === "modal_sell_spawners";
    if (isBuySpawner || isSellSpawner) {
      const ign = interaction.fields.getTextInputValue("ign");
      const amount = interaction.fields.getTextInputValue("amount");
      const type = isBuySpawner ? "buy" : "sell";
      const guild = interaction.guild;

      const existing = guild.channels.cache.find((c) => c.name === `spawner-${type}-${interaction.user.username.toLowerCase()}`);
      if (existing) return interaction.reply({ content: `❌ You already have an open ticket: ${existing}`, ephemeral: true });

      const overwrites = [
        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
        { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] },
        { id: OWNER_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
        { id: MOD_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
      ];

      const ticketChannel = await guild.channels.create({
        name: `spawner-${type}-${interaction.user.username.toLowerCase()}`,
        type: ChannelType.GuildText,
        permissionOverwrites: overwrites,
        ...(TICKET_CATEGORY_ID ? { parent: TICKET_CATEGORY_ID } : {}),
      });

      const price = isBuySpawner ? 4.7 : 4.4;
      const total = (parseFloat(amount) * price).toLocaleString();

      const ticketEmbed = new EmbedBuilder()
        .setTitle(isBuySpawner ? "🛒 Buy Spawners Order" : "💰 Sell Spawners Order")
        .setDescription([
          `**User:** ${interaction.user}`,
          `**IGN:** \`${ign}\``,
          `**Amount:** \`${amount} spawners\``,
          `**Price:** ${price}M each`,
          `**Total:** ~${total}M`,
          "",
          "A staff member will be with you shortly.",
        ].join("\n"))
        .setColor(isBuySpawner ? 0x5865f2 : 0x57f287)
        .setTimestamp()
        .setFooter({ text: "Claude's Bot • Spawner Shop" });

      const closeBtn = new ButtonBuilder().setCustomId("close_ticket").setLabel("🔒 Close Ticket").setStyle(ButtonStyle.Danger);
      await ticketChannel.send({ content: `${interaction.user} <@&${OWNER_ROLE_ID}>`, embeds: [ticketEmbed], components: [new ActionRowBuilder().addComponents(closeBtn)] });
      return await interaction.reply({ content: `✅ Your ticket has been opened: ${ticketChannel}`, ephemeral: true });
    }

    // Build/Digout tickets
    const isFarm = interaction.customId === "modal_farm";
    const isDigout = interaction.customId === "modal_digout";
    if (!isFarm && !isDigout) return;

    const ign = interaction.fields.getTextInputValue("ign");
    const extra = interaction.fields.getTextInputValue("extra") || "None";
    const type = isFarm ? "farm" : "digout";
    const guild = interaction.guild;

    const existing = guild.channels.cache.find((c) => c.name === `${type}-${interaction.user.username.toLowerCase()}`);
    if (existing) return interaction.reply({ content: `❌ You already have an open ticket: ${existing}`, ephemeral: true });

    const overwrites = [
      { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
      { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
      { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels] },
      { id: OWNER_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
      { id: MOD_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
    ];

    const channelOptions = {
      name: `${type}-${interaction.user.username.toLowerCase()}`,
      type: ChannelType.GuildText,
      permissionOverwrites: overwrites,
    };
    if (TICKET_CATEGORY_ID) channelOptions.parent = TICKET_CATEGORY_ID;

    const ticketChannel = await guild.channels.create(channelOptions);

    let description;
    if (isFarm) {
      const farmName = interaction.fields.getTextInputValue("farm_name");
      description = [`**User:** ${interaction.user}`, `**IGN:** \`${ign}\``, `**Farm:** \`${farmName}\``, `**Extra Info:** ${extra}`, "", "A staff member will be with you shortly."].join("\n");
    } else {
      const dimensions = interaction.fields.getTextInputValue("dimensions");
      description = [`**User:** ${interaction.user}`, `**IGN:** \`${ign}\``, `**Dimensions:** \`${dimensions}\``, `**Extra Info:** ${extra}`, "", "A staff member will be with you shortly."].join("\n");
    }

    const ticketEmbed = new EmbedBuilder()
      .setTitle(isFarm ? "🌾 Farm Order" : "⛏️ Digout Order")
      .setDescription(description)
      .setColor(isFarm ? 0x5865f2 : 0xed4245)
      .setTimestamp()
      .setFooter({ text: "Claude's Bot • Build Services" });

    const closeBtn = new ButtonBuilder().setCustomId("close_ticket").setLabel("🔒 Close Ticket").setStyle(ButtonStyle.Danger);
    await ticketChannel.send({ content: `${interaction.user} <@&${OWNER_ROLE_ID}>`, embeds: [ticketEmbed], components: [new ActionRowBuilder().addComponents(closeBtn)] });
    await interaction.reply({ content: `✅ Your ticket has been opened: ${ticketChannel}`, ephemeral: true });

    if (LOG_CHANNEL_ID) {
      const logChannel = guild.channels.cache.get(LOG_CHANNEL_ID);
      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setTitle("📋 Ticket Opened")
          .setDescription(`**User:** ${interaction.user}\n**Type:** ${isFarm ? "Farm Order" : "Digout"}\n**Channel:** ${ticketChannel}`)
          .setColor(0x57f287)
          .setTimestamp();
        await logChannel.send({ embeds: [logEmbed] });
      }
    }
  }
});

client.login(TOKEN);
