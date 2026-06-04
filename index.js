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
const WELCOME_CHANNEL_ID = "1510395267495755886";
const AUTO_ROLE_ID = "1510275196576207051";
const LOG_CHANNEL_ID = "1510701776310108360";
const OWNER_ROLE_ID = "1510275124069404924";
const MOD_ROLE_ID = "1510275193493389413";
const BUILDER_ROLE_ID = "1510839345278353519";

// Ticket category IDs
const CATEGORIES = {
  ticket_staff:    "1510734321475125288",
  order_farm:      "1510734345709555773",
  order_digout:    "1510734345709555773",
  ticket_builder:  "1510734369646710967",
  ticket_general:  "1510734392140632204",
  ticket_giveaway: "1510793515120984134",
  spawner:         "1511976380206944426",
};
// ─────────────────────────────────────────────────────────────────────────────

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

// ─── HELPER: Create ticket channel ───────────────────────────────────────────
async function createTicketChannel(guild, name, categoryId, allowedRoles) {
  const overwrites = [
    { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
    { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels, PermissionFlagsBits.ReadMessageHistory] },
  ];
  for (const roleId of allowedRoles) {
    overwrites.push({ id: roleId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] });
  }
  return await guild.channels.create({
    name,
    type: ChannelType.GuildText,
    permissionOverwrites: overwrites,
    parent: categoryId || undefined,
  });
}

// ─── HELPER: Close ticket ────────────────────────────────────────────────────
async function handleCloseTicket(interaction) {
  await interaction.reply({ content: "🔒 Saving transcript and closing in 5 seconds..." });

  const messages = await interaction.channel.messages.fetch({ limit: 100 });
  const sorted = [...messages.values()].reverse();
  const date = new Date();
  const dateStr = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;

  let lines = [
    `================================================================================`,
    `                         TICKET TRANSCRIPT`,
    `================================================================================`,
    `Channel:   ${interaction.channel.name}`,
    `Server:    ${interaction.guild.name}`,
    `Closed by: ${interaction.user.tag}`,
    `Date:      ${date.toLocaleString()}`,
    `================================================================================`,
    ``,
  ];
  for (const msg of sorted) {
    lines.push(`[${new Date(msg.createdTimestamp).toLocaleString()}] ${msg.author.tag}:`);
    lines.push(`  ${msg.content || "[embed/attachment]"}`);
    lines.push(``);
  }
  lines.push(`================================================================================`);
  const transcript = lines.join("\n");
  const fileName = `transcript-${interaction.channel.name}-${dateStr}.txt`;
  const attachment = new AttachmentBuilder(Buffer.from(transcript, "utf-8"), { name: fileName });

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
    const userAttachment = new AttachmentBuilder(Buffer.from(transcript, "utf-8"), { name: fileName });
    await interaction.user.send({ content: `📄 Transcript for **${interaction.channel.name}**:`, files: [userAttachment] });
  } catch {}

  setTimeout(() => interaction.channel.delete("Ticket closed").catch(console.error), 5000);
}

// ─── COMMANDS ────────────────────────────────────────────────────────────────
client.on(Events.MessageCreate, async (message) => {
  if (!message.member) return;
  const isAdmin = message.member.permissions.has(PermissionFlagsBits.Administrator);
  const isStaff = message.member.roles.cache.has(MOD_ROLE_ID) || message.member.roles.cache.has(OWNER_ROLE_ID);

  // !panel - Build Services
  if (message.content === "!panel" && (isAdmin || isStaff)) {
    const embed = new EmbedBuilder()
      .setTitle("Build Services")
      .setDescription([
        "Order a farm build or digout service. Select what you need below.",
        "",
        "**Farm Order** — Order a prebuilt farm from our catalog",
        "**Digout** — Request a custom dig-out by dimensions",
        "> Priced at **800 dollar per block** · Formula: X x Y x Z x 800",
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
      .setTitle("🎫 Create a Ticket")
      .setDescription([
        "Please click one of the buttons below to open a support ticket.",
        "",
        "━━━━━━━━━━━━━━━━━━━━━━━━",
        "",
        "👔 **Apply For Staff** — Apply to join our staff team",
        "🔨 **Apply for Builder** — Apply to become a builder",
        "🎁 **Claim a Giveaway win** — Claim your giveaway prize",
        "❓ **General Questions** — Any other questions or support",
      ].join("\n"))
      .setColor(0x2b2d31)
      .setFooter({ text: "Claude's Bot • Support" })
      .setTimestamp();

    const staffBtn = new ButtonBuilder().setCustomId("ticket_staff").setLabel("Apply For Staff").setStyle(ButtonStyle.Secondary);
    const builderBtn = new ButtonBuilder().setCustomId("ticket_builder").setLabel("Apply for Builder").setStyle(ButtonStyle.Success);
    const giveawayBtn = new ButtonBuilder().setCustomId("ticket_giveaway").setLabel("Claim a Giveaway win").setStyle(ButtonStyle.Primary);
    const generalBtn = new ButtonBuilder().setCustomId("ticket_general").setLabel("General Questions").setStyle(ButtonStyle.Danger);

    await message.channel.send({ embeds: [embed], components: [
      new ActionRowBuilder().addComponents(staffBtn, builderBtn),
      new ActionRowBuilder().addComponents(giveawayBtn, generalBtn),
    ]});
    await message.delete().catch(() => {});
  }

  // !addstaff @user
  if (message.content.startsWith("!addstaff") && isAdmin) {
    const target = message.mentions.members.first();
    if (!target) return message.reply("❌ Mention a user.");
    await target.roles.add(MOD_ROLE_ID);
    await message.reply({ content: `✅ Added staff role to ${target}.`, allowedMentions: { repliedUser: false } });
  }

  // !removestaff @user
  if (message.content.startsWith("!removestaff") && isAdmin) {
    const target = message.mentions.members.first();
    if (!target) return message.reply("❌ Mention a user.");
    await target.roles.remove(MOD_ROLE_ID);
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
        "**!addstaff @user** — Give staff role *(admin only)*",
        "**!removestaff @user** — Remove staff role *(admin only)*",
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

    // Farm order modal
    if (interaction.customId === "order_farm") {
      const modal = new ModalBuilder().setCustomId("modal_farm").setTitle("Farm Order");
      modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("ign").setLabel("Your IGN").setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("farm_name").setLabel("Which farm do you want?").setStyle(TextInputStyle.Short).setPlaceholder("e.g. Mauschu Advanced").setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("extra").setLabel("Any extra info? (optional)").setStyle(TextInputStyle.Paragraph).setRequired(false))
      );
      return await interaction.showModal(modal);
    }

    // Digout modal
    if (interaction.customId === "order_digout") {
      const modal = new ModalBuilder().setCustomId("modal_digout").setTitle("Digout Order");
      modal.addComponents(
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("ign").setLabel("Your IGN").setStyle(TextInputStyle.Short).setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("dimensions").setLabel("Dimensions (X x Y x Z)").setStyle(TextInputStyle.Short).setPlaceholder("e.g. 50 x 10 x 50").setRequired(true)),
        new ActionRowBuilder().addComponents(new TextInputBuilder().setCustomId("extra").setLabel("Any extra info? (optional)").setStyle(TextInputStyle.Paragraph).setRequired(false))
      );
      return await interaction.showModal(modal);
    }

    // Spawner modals
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

    // Support ticket buttons (no modal — open ticket directly)
    if (["ticket_staff", "ticket_builder", "ticket_giveaway", "ticket_general"].includes(interaction.customId)) {
      const typeMap = {
        ticket_staff:    { name: "staff-app",      title: "Apply For Staff",       color: 0x5865f2, roles: [OWNER_ROLE_ID, MOD_ROLE_ID] },
        ticket_builder:  { name: "builder-app",    title: "Apply for Builder",     color: 0x57f287, roles: [OWNER_ROLE_ID, MOD_ROLE_ID] },
        ticket_giveaway: { name: "giveaway-claim", title: "Claim a Giveaway win",  color: 0xfee75c, roles: [OWNER_ROLE_ID, MOD_ROLE_ID] },
        ticket_general:  { name: "general",        title: "General Questions",     color: 0xed4245, roles: [OWNER_ROLE_ID, MOD_ROLE_ID] },
      };
      const type = typeMap[interaction.customId];
      const guild = interaction.guild;
      const channelName = `${type.name}-${interaction.user.username.toLowerCase()}`;

      const existing = guild.channels.cache.find(c => c.name === channelName);
      if (existing) return interaction.reply({ content: `❌ You already have an open ticket: ${existing}`, ephemeral: true });

      const ticketChannel = await createTicketChannel(
        guild, channelName, CATEGORIES[interaction.customId],
        [...type.roles, interaction.user.id]
      );

      const ticketEmbed = new EmbedBuilder()
        .setTitle(type.title)
        .setDescription([
          `**Opened by:** ${interaction.user}`,
          `**Type:** ${type.title}`,
          "",
          "Please describe your request in detail.",
          "A staff member will assist you shortly.",
        ].join("\n"))
        .setColor(type.color)
        .setTimestamp()
        .setFooter({ text: "Claude's Bot • Support" });

      const closeBtn = new ButtonBuilder().setCustomId("close_ticket").setLabel("Close Ticket").setStyle(ButtonStyle.Danger);
      await ticketChannel.send({
        content: `${interaction.user} <@&${OWNER_ROLE_ID}> <@&${MOD_ROLE_ID}>`,
        embeds: [ticketEmbed],
        components: [new ActionRowBuilder().addComponents(closeBtn)],
      });
      return await interaction.reply({ content: `✅ Ticket created: ${ticketChannel}`, ephemeral: true });
    }

    // Close ticket
    if (interaction.customId === "close_ticket") {
      return await handleCloseTicket(interaction);
    }
  }

  // ── Modal submits ──────────────────────────────────────────────────────────
  if (interaction.isModalSubmit()) {

    // Spawner tickets
    if (interaction.customId === "modal_buy_spawners" || interaction.customId === "modal_sell_spawners") {
      const isBuy = interaction.customId === "modal_buy_spawners";
      const ign = interaction.fields.getTextInputValue("ign");
      const amount = interaction.fields.getTextInputValue("amount");
      const type = isBuy ? "buy" : "sell";
      const guild = interaction.guild;
      const channelName = `spawner-${type}-${interaction.user.username.toLowerCase()}`;

      const existing = guild.channels.cache.find(c => c.name === channelName);
      if (existing) return interaction.reply({ content: `❌ You already have an open ticket: ${existing}`, ephemeral: true });

      const ticketChannel = await createTicketChannel(
        guild, channelName, CATEGORIES.spawner,
        [OWNER_ROLE_ID, MOD_ROLE_ID, interaction.user.id]
      );

      const price = isBuy ? 4.7 : 4.4;
      const total = (parseFloat(amount) * price).toLocaleString();

      const ticketEmbed = new EmbedBuilder()
        .setTitle(isBuy ? "Buy Spawners Order" : "Sell Spawners Order")
        .setDescription([
          `**User:** ${interaction.user}`,
          `**IGN:** \`${ign}\``,
          `**Amount:** \`${amount} spawners\``,
          `**Price:** ${price}M each`,
          `**Total:** ~${total}M`,
          "",
          "A staff member will be with you shortly.",
        ].join("\n"))
        .setColor(isBuy ? 0x5865f2 : 0x57f287)
        .setTimestamp()
        .setFooter({ text: "Claude's Bot • Spawner Shop" });

      const closeBtn = new ButtonBuilder().setCustomId("close_ticket").setLabel("Close Ticket").setStyle(ButtonStyle.Danger);
      await ticketChannel.send({
        content: `${interaction.user} <@&${OWNER_ROLE_ID}> <@&${MOD_ROLE_ID}>`,
        embeds: [ticketEmbed],
        components: [new ActionRowBuilder().addComponents(closeBtn)],
      });
      return await interaction.reply({ content: `✅ Your ticket has been opened: ${ticketChannel}`, ephemeral: true });
    }

    // Farm/Digout tickets
    const isFarm = interaction.customId === "modal_farm";
    const isDigout = interaction.customId === "modal_digout";
    if (!isFarm && !isDigout) return;

    const ign = interaction.fields.getTextInputValue("ign");
    const extra = interaction.fields.getTextInputValue("extra") || "None";
    const type = isFarm ? "farm" : "digout";
    const guild = interaction.guild;
    const channelName = `${type}-${interaction.user.username.toLowerCase()}`;

    const existing = guild.channels.cache.find(c => c.name === channelName);
    if (existing) return interaction.reply({ content: `❌ You already have an open ticket: ${existing}`, ephemeral: true });

    const ticketChannel = await createTicketChannel(
      guild, channelName, CATEGORIES[isFarm ? "order_farm" : "order_digout"],
      [OWNER_ROLE_ID, MOD_ROLE_ID, BUILDER_ROLE_ID, interaction.user.id]
    );

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
    await ticketChannel.send({
      content: `${interaction.user} <@&${OWNER_ROLE_ID}> <@&${MOD_ROLE_ID}> <@&${BUILDER_ROLE_ID}>`,
      embeds: [ticketEmbed],
      components: [new ActionRowBuilder().addComponents(closeBtn)],
    });
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
