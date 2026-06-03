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
const WELCOME_CHANNEL_ID = process.env.WELCOME_CHANNEL_ID || "1510395267495755886";
const AUTO_ROLE_ID = process.env.AUTO_ROLE_ID || "1510275196576207051";
const LOG_CHANNEL_ID = process.env.LOG_CHANNEL_ID || "1510701776310108360";
// ─────────────────────────────────────────────────────────────────────────────

client.once(Events.ClientReady, () => {
  console.log(`✅ Claude's Bot is online as ${client.user.tag}`);
});

// ─── WELCOME + AUTO ROLE ─────────────────────────────────────────────────────
client.on(Events.GuildMemberAdd, async (member) => {
  // Auto role
  if (AUTO_ROLE_ID) {
    const role = member.guild.roles.cache.get(AUTO_ROLE_ID);
    if (role) await member.roles.add(role).catch(console.error);
  }

  // Welcome message
  if (WELCOME_CHANNEL_ID) {
    const channel = member.guild.channels.cache.get(WELCOME_CHANNEL_ID);
    if (!channel) return;

    const memberCount = member.guild.memberCount;
    const embed = new EmbedBuilder()
      .setTitle("👋 Welcome!")
      .setDescription(
        [
          `Welcome to **${member.guild.name}**, ${member}! 🎉`,
          `You are member **#${memberCount}**.`,
          `Please read the rules and enjoy your stay!`,
        ].join("\n")
      )
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
      .setDescription(
        [
          "Order a farm build or digout service. Select what you need below.",
          "",
          "**Farm Order** — Order a prebuilt farm from our catalog",
          "**Digout** — Request a custom dig-out by dimensions",
          "> Priced at **8000 dollar per block** · Formula: X  Y  Z  800",
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
        ].join("\n")
      )
      .setColor(0x2b2d31)
      .setFooter({ text: "Claude's Bot • Build Services" })
      .setTimestamp();

    const farmBtn = new ButtonBuilder()
      .setCustomId("order_farm")
      .setLabel("Farm Order")
      .setStyle(ButtonStyle.Primary);

    const digoutBtn = new ButtonBuilder()
      .setCustomId("order_digout")
      .setLabel("Digout")
      .setStyle(ButtonStyle.Secondary);

    await message.channel.send({ embeds: [embed], components: [new ActionRowBuilder().addComponents(farmBtn, digoutBtn)] });
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
      .setDescription(
        [
          "**!panel** — Post the build services panel",
          "**!addstaff @user** — Give staff role to a user *(admin only)*",
          "**!removestaff @user** — Remove staff role from a user *(admin only)*",
          "**!help** — Show this message",
        ].join("\n")
      )
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
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("ign").setLabel("Your IGN").setStyle(TextInputStyle.Short).setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("farm_name").setLabel("Which farm do you want?").setStyle(TextInputStyle.Short).setPlaceholder("e.g. Mauschu Advanced").setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("extra").setLabel("Any extra info? (optional)").setStyle(TextInputStyle.Paragraph).setRequired(false)
        )
      );
      return await interaction.showModal(modal);
    }

    if (interaction.customId === "order_digout") {
      const modal = new ModalBuilder().setCustomId("modal_digout").setTitle("Digout Order");
      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("ign").setLabel("Your IGN").setStyle(TextInputStyle.Short).setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("dimensions").setLabel("Dimensions (X x Y x Z)").setStyle(TextInputStyle.Short).setPlaceholder("e.g. 50 x 10 x 50").setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("extra").setLabel("Any extra info? (optional)").setStyle(TextInputStyle.Paragraph).setRequired(false)
        )
      );
      return await interaction.showModal(modal);
    }

    // ── Close ticket ──────────────────────────────────────────────────────────
    if (interaction.customId === "close_ticket") {
      await interaction.reply({ content: "🔒 Saving transcript and closing in 5 seconds..." });

      // Build transcript
      const messages = await interaction.channel.messages.fetch({ limit: 100 });
      const sorted = [...messages.values()].reverse();
      const transcript = sorted
        .map((m) => `[${new Date(m.createdTimestamp).toLocaleString()}] ${m.author.tag}: ${m.content || "[embed/attachment]"}`)
        .join("\n");

      const attachment = new AttachmentBuilder(Buffer.from(transcript, "utf-8"), {
        name: `transcript-${interaction.channel.name}.txt`,
      });

      // Send transcript to log channel
      if (LOG_CHANNEL_ID) {
        const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);
        if (logChannel) {
          const logEmbed = new EmbedBuilder()
            .setTitle("Ticket Closed")
            .setDescription(`**Channel:** ${interaction.channel.name}\n**Closed by:** ${interaction.user}`)
            .setColor(0xed4245)
            .setTimestamp();
          await logChannel.send({ embeds: [logEmbed], files: [attachment] });
        }
      }

      // Send transcript to user
      try {
        const userAttachment = new AttachmentBuilder(Buffer.from(transcript, "utf-8"), {
          name: `transcript-${interaction.channel.name}.txt`,
        });
        await interaction.user.send({
          content: `Here is your ticket transcript for **${interaction.channel.name}**:`,
          files: [userAttachment],
        });
      } catch {}

      // Give bot perms to delete and delete after 5s
      await interaction.channel.permissionOverwrites.edit(client.user.id, { ManageChannels: true }).catch(() => {});
      setTimeout(() => interaction.channel.delete("Ticket closed").catch(console.error), 5000);
    }
  }

  // ── Modal submit ──────────────────────────────────────────────────────────
  if (interaction.isModalSubmit()) {
    const isFarm = interaction.customId === "modal_farm";
    const isDigout = interaction.customId === "modal_digout";
    if (!isFarm && !isDigout) return;

    const ign = interaction.fields.getTextInputValue("ign");
    const extra = interaction.fields.getTextInputValue("extra") || "None";
    const type = isFarm ? "farm" : "digout";

    const guild = interaction.guild;
    const existing = guild.channels.cache.find(
      (c) => c.name === `${type}-${interaction.user.username.toLowerCase()}`
    );
    if (existing) {
      return interaction.reply({ content: `❌ You already have an open ticket: ${existing}`, ephemeral: true });
    }

    const overwrites = [
      { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
      {
        id: interaction.user.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
      },
      {
        id: client.user.id,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageChannels],
      },
    ];
    if (STAFF_ROLE_ID) {
      overwrites.push({
        id: STAFF_ROLE_ID,
        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
      });
    }

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
    const ping = STAFF_ROLE_ID ? `<@&${STAFF_ROLE_ID}>` : "";

    await ticketChannel.send({ content: `${interaction.user} ${ping}`, embeds: [ticketEmbed], components: [new ActionRowBuilder().addComponents(closeBtn)] });
    await interaction.reply({ content: `✅ Your ticket has been opened: ${ticketChannel}`, ephemeral: true });

    // Log ticket open
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
