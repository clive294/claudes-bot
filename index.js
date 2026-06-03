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

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const TOKEN = process.env.DISCORD_TOKEN;
const STAFF_ROLE_ID = process.env.STAFF_ROLE_ID || null;
const TICKET_CATEGORY_ID = process.env.TICKET_CATEGORY_ID || null;
const WELCOME_CHANNEL_ID = "1510395267495755886";
const AUTO_ROLE_ID = "1510275196576207051";
const LOG_CHANNEL_ID = "1510701776310108360";
const OWNER_ROLE_ID = "1510275124069404924";
const MOD_ROLE_ID = "1510275193493389413";
const BUILDER_ROLE_ID = "1510839345278353519";
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

// ─── WELCOME + AUTO ROLE ─────────────────────────────────────────────────────
client.on(Events.GuildMemberAdd, async (member) => {
  if (AUTO_ROLE_ID) {
    const role = member.guild.roles.cache.get(AUTO_ROLE_ID);
    if (role) await member.roles.add(role).catch(console.error);
  }

  if (WELCOME_CHANNEL_ID) {
    const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
    if (!channel) return;

    const embed = new EmbedBuilder()
      .setTitle("👋 Welcome!")
      .setDescription([
        `Welcome to **${member.guild.name}**, ${member}! 🎉`,
        `You are member **#${member.guild.memberCount}**.`,
        `Please read the rules and enjoy your stay!`,
      ].join("\n"))
      .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
      .setColor(0x5865f2)
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

  // !panel
  if (message.content === "!panel" && (isAdmin || isStaff)) {
    const embed = new EmbedBuilder()
      .setTitle("Build Services")
      .setDescription([
        "Order a farm build or digout service. Select what you need below.",
        "",
        "**Farm Order** — Order a prebuilt farm from our catalog",
        "**Digout** — Request a custom dig-out by dimensions",
        "> Priced at **800 dollars per block** · Formula: X  Y  Z  800",
        "",
        "━━━━━━━━━━━━━━━━━━━━━━━━",
        "",
        "**Jester Farms**",
        "• Advanced Kelp — 450M",
        "• Beginner Kelp — 175M",
        "• Bone Block Crafter Mini — 130M",
        "• Bone Block Crafter V2 — 720M",
        "• Cobble Farm — 450M",
        "",
        "**Fire Azure Farms**",
        "• Fire Azure V2.5 — 350M",
        "• Fire Azure V3 — 450M",
        "• Fire Azure V3.1 — 220M",
        "• Fire Azure V3.5 — 680M",
        "• Fire Azure V4 — 900M",
        "",
        "**Ikea Farms**",
        "• Ikea V1 — 175M",
        "• Ikea V5 — 800M",
        "• Intermediate Kelp — 270M",
        "",
        "**Mauschu Farms**",
        "• Mauschu Beginner — 40M",
        "• Mauschu Intermediate — 150M",
        "• Mauschu Advanced — 450M",
        "• Mauschu Newbie 1 Module — 18M",
        "• Mauschu V6 — 580M",
        "• Mauschu V7 — 630M",
        "• Mauschu V8 — 800M",
        "• Mauschu V9 — 1.1B",
        "• Mauschu V10 — 900M",
        "",
        "**Ravixx Farms**",
        "• Ravixx 1680 Smokers Industrial Kelp — 680M",
        "• Ravixx McDonalds 240 Smokers — 130M",
        "",
        "━━━━━━━━━━━━━━━━━━━━━━━━",
        "**Rules**",
        "• Open only **ONE** build ticket at a time",
        "• Be respectful, detailed, and patient",
      ].join("\n"))
      .setColor(0x2b2d31)
      .setFooter({ text: "Claude's Bot • Build Services" })
      .setTimestamp();

    const farmBtn = new ButtonBuilder().setCustomId("order_farm").setLabel("Farm Order").setStyle(ButtonStyle.Primary);
    const digoutBtn = new ButtonBuilder().setCustomId("order_digout").setLabel("Digout").setStyle(ButtonStyle.Secondary);
    await message.channel.send({ embeds: [embed], components: [new ActionRowBuilder().addComponents(farmBtn, digoutBtn)] });
    await message.delete().catch(() => {});
  }

  // !spawnerpanel
  if (message.content === "!spawnerpanel" && (isAdmin || isStaff)) {
    const embed = new EmbedBuilder()
      .setTitle("Skeleton Spawner Shop")
      .setDescription([
        "**Selling:** *(We Sell To You)*",
        "🦴 Skeleton Spawners — **4.7M each**",
        "",
        "**Buying:** *(You Sell To Us)*",
        "🦴 Skeleton Spawners — **4.4M each**",
        "",
        "━━━━━━━━━━━━━━━━━━━━━━━━",
        "",
        "**Rules**",
        "• 32 spawners minimum to Sell or Buy",
        "• We do **NOT** go first",
        "• We do **NOT** negotiate on prices",
        "⚠️ Failure to complete trades may result in a **ban**",
        "",
        "Open a ticket below to sell or buy spawners.",
      ].join("\n"))
      .setColor(0x2b2d31)
      .setFooter({ text: "Claude's Bot • Spawner Shop" })
      .setTimestamp();

    const sellBtn = new ButtonBuilder().setCustomId("sell_spawners").setLabel("Sell Spawners").setStyle(ButtonStyle.Success);
    const buyBtn = new ButtonBuilder().setCustomId("buy_spawners").setLabel("Buy Spawners").setStyle(ButtonStyle.Primary);
    await message.channel.send({ embeds: [embed], components: [new ActionRowBuilder().addComponents(sellBtn, buyBtn)] });
    await message.delete().catch(() => {});
  }

  // !ticketpanel
  if (message.content === "!ticketpanel" && (isAdmin || isStaff)) {
    const embed = new EmbedBuilder()
      .setTitle("🎫 Create a ticket")
      .setDescription([
        "Please click on the button below to create a support ticket.",
        "",
        "━━━━━━━━━━━━━━━━━━━━━━━━",
        "",
        "**Claude's Helper.**",
      ].join("\n"))
      .setColor(0x2b2d31)
      .setFooter({ text: "Ticketty | Ticket System" })
      .setTimestamp();

    const staffBtn = new ButtonBuilder().setCustomId("ticket_staff").setLabel("Apply For Staff").setStyle(ButtonStyle.Secondary);
    const builderBtn = new ButtonBuilder().setCustomId("ticket_builder").setLabel("Apply for Builder").setStyle(ButtonStyle.Success);
    const giveawayBtn = new ButtonBuilder().setCustomId("ticket_giveaway").setLabel("Claim a Giveaway win").setStyle(ButtonStyle.Primary);
    const generalBtn = new ButtonBuilder().setCustomId("ticket_general").setLabel("General Questions").setStyle(ButtonStyle.Danger);

    const row1 = new ActionRowBuilder().addComponents(staffBtn, builderBtn);
    const row2 = new ActionRowBuilder().addComponents(giveawayBtn, generalBtn);

    await message.channel.send({ embeds: [embed], components: [row1, row2] });
    await message.delete().catch(() => {});
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
        "**!help** — Show this message",
      ].join("\n"))
      .setColor(0x5865f2);
    await message.reply({ embeds: [embed] });
  }
});

// ─── INTERACTIONS ─────────────────────────────────────────────────────────────
client.on(Events.InteractionCreate, async (interaction) => {

  // ── Buttons ────────────────────────────────────────────────────────────────
  if (interaction.isButton()) {

    if (interaction.customId === "order_farm") {
      const modal = new ModalBuilder().setCustomId("modal_farm").setTitle("Farm Order");
      modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("ign").setLabel("Your IGN").setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("farm_name").setLabel("Which farm do you want?").setStyle(TextInputStyle.Short).setPlaceholder("e.g. Mauschu Advanced").setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("extra").setLabel("Any extra info? (optional)").setStyle(TextInputStyle.Paragraph).setRequired(false))
      );
      return await interaction.showModal(modal);
    }

    if (interaction.customId === "order_digout") {
      const modal = new ModalBuilder().setCustomId("modal_digout").setTitle("Digout Order");
      modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("ign").setLabel("Your IGN").setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("dimensions").setLabel("Dimensions (X  Y  Z)").setStyle(TextInputStyle.Short).setPlaceholder("e.g. 50 x 10 x 50").setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("extra").setLabel("Any extra info? (optional)").setStyle(TextInputStyle.Paragraph).setRequired(false))
      );
      return await interaction.showModal(modal);
    }

    if (interaction.customId === "sell_spawners" || interaction.customId === "buy_spawners") {
      const isBuy = interaction.customId === "buy_spawners";
      const modal = new ModalBuilder()
        .setCustomId(isBuy ? "modal_buy_spawners" : "modal_sell_spawners")
        .setTitle(isBuy ? "Buy Spawners" : "Sell Spawners");
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
      
      const existing = guild.channels.cache.find(c => c.name === `${type.name}-${interaction.user.username.toLowerCase()}`);
      if (existing) {
        return interaction.reply({ content: `❌ You already have an open ticket: ${existing}`, ephemeral: true });
      }
      
      const overwrites = [
        { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
        { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.AttachFiles] },
        { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ReadMessageHistory] },
      ];
      
      if (OWNER_ROLE_ID) overwrites.push({ id: OWNER_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] });
      if (MOD_ROLE_ID) overwrites.push({ id: MOD_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] });
      if (BUILDER_ROLE_ID) overwrites.push({ id: BUILDER_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] });
      
      const ticketChannel = await guild.channels.create({
        name: `${type.name}-${interaction.user.username.toLowerCase()}`,
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
      
      const closeBtn = new ButtonBuilder().setCustomId("close_ticket").setLabel("Close Ticket").setStyle(ButtonStyle.Danger);
      
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
        .setTitle(isBuySpawner ? "Buy Spawners Order" : "Sell Spawners Order")
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

      const closeBtn = new ButtonBuilder().setCustomId("close_ticket").setLabel("Close Ticket").setStyle(ButtonStyle.Danger);
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
      { id: BUILDER_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
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
      .setTitle(isFarm ? "Farm Order" : "Digout Order")
      .setDescription(description)
      .setColor(isFarm ? 0x5865f2 : 0xed4245)
      .setTimestamp()
      .setFooter({ text: "Claude's Bot • Build Services" });

    const closeBtn = new ButtonBuilder().setCustomId("close_ticket").setLabel("Close Ticket").setStyle(ButtonStyle.Danger);
    await ticketChannel.send({ content: `${interaction.user} <@&${OWNER_ROLE_ID}>`, embeds: [ticketEmbed], components: [new ActionRowBuilder().addComponents(closeBtn)] });
    await interaction.reply({ content: `✅ Your ticket has been opened: ${ticketChannel}`, ephemeral: true });

    if (LOG_CHANNEL_ID) {
      const logChannel = guild.channels.cache.get(LOG_CHANNEL_ID);
      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setTitle("Ticket Opened")
          .setDescription(`**User:** ${interaction.user}\n**Type:** ${isFarm ? "Farm Order" : "Digout"}\n**Channel:** ${ticketChannel}`)
          .setColor(0x57f287)
          .setTimestamp();
        await logChannel.send({ embeds: [logEmbed] });
      }
    }
  }
});

client.login(TOKEN);
