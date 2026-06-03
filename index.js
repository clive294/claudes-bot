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
} = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// ─── CONFIG ──────────────────────────────────────────────────────────────────
const TOKEN = process.env.DISCORD_TOKEN;
const STAFF_ROLE_ID = process.env.STAFF_ROLE_ID;
const TICKET_CATEGORY_ID = process.env.TICKET_CATEGORY_ID;
// ─────────────────────────────────────────────────────────────────────────────

client.once(Events.ClientReady, () => {
  console.log(`✅ Claude's Bot is online as ${client.user.tag}`);
});

// !panel command
client.on(Events.MessageCreate, async (message) => {
  if (!message.member) return;
  if (
    message.content === "!panel" &&
    message.member.permissions.has(PermissionFlagsBits.ManageChannels)
  ) {
    const embed = new EmbedBuilder()
      .setTitle("Build Services")
      .setDescription(
        [
          "Order a farm build or digout service. Select what you need below.",
          "",
          "**Farm Order** — Order a prebuilt farm from our catalog",
          "**Digout** — Request a custom dig-out by dimensions",
          "> Priced at **800 per block** · Formula: X  Y  Z x 800",
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

    const row = new ActionRowBuilder().addComponents(farmBtn, digoutBtn);

    await message.channel.send({ embeds: [embed], components: [row] });
    await message.delete().catch(() => {});
  }
});

client.on(Events.InteractionCreate, async (interaction) => {
  // ── Buttons → open modal ─────────────────────────────────────────────────
  if (interaction.isButton()) {
    if (interaction.customId === "order_farm") {
      const modal = new ModalBuilder()
        .setCustomId("modal_farm")
        .setTitle("Farm Order");

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("ign")
            .setLabel("Your IGN")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("farm_name")
            .setLabel("Which farm do you want?")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("e.g. Mauschu Advanced")
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("extra")
            .setLabel("Any extra info? (optional)")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(false)
        )
      );

      return await interaction.showModal(modal);
    }

    if (interaction.customId === "order_digout") {
      const modal = new ModalBuilder()
        .setCustomId("modal_digout")
        .setTitle("Digout Order");

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("ign")
            .setLabel("Your IGN")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("dimensions")
            .setLabel("Dimensions (X x Y x Z)")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder("e.g. 50 x 10 x 50")
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId("extra")
            .setLabel("Any extra info? (optional)")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(false)
        )
      );

      return await interaction.showModal(modal);
    }

    // ── Close ticket ────────────────────────────────────────────────────────
    if (interaction.customId === "close_ticket") {
      const channel = interaction.channel;
      await interaction.reply({ content: "🔒 Closing ticket in 5 seconds..." });

      // Give bot manage channel perms to delete it
      await channel.permissionOverwrites.edit(client.user.id, {
        ManageChannels: true,
      }).catch(() => {});

      setTimeout(() => channel.delete("Ticket closed").catch(console.error), 5000);
    }
  }

  // ── Modal submit → create ticket ────────────────────────────────────────
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
      return interaction.reply({
        content: `❌ You already have an open ticket: ${existing}`,
        ephemeral: true,
      });
    }

    const overwrites = [
      { id: guild.id, deny: [PermissionFlagsBits.ViewChannel] },
      {
        id: interaction.user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
        ],
      },
      {
        id: client.user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ManageChannels,
        ],
      },
    ];

    if (STAFF_ROLE_ID) {
      overwrites.push({
        id: STAFF_ROLE_ID,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
        ],
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
      description = [
        `**User:** ${interaction.user}`,
        `**IGN:** \`${ign}\``,
        `**Farm:** \`${farmName}\``,
        `**Extra Info:** ${extra}`,
        "",
        "A staff member will be with you shortly.",
      ].join("\n");
    } else {
      const dimensions = interaction.fields.getTextInputValue("dimensions");
      description = [
        `**User:** ${interaction.user}`,
        `**IGN:** \`${ign}\``,
        `**Dimensions:** \`${dimensions}\``,
        `**Extra Info:** ${extra}`,
        "",
        "A staff member will be with you shortly.",
      ].join("\n");
    }

    const ticketEmbed = new EmbedBuilder()
      .setTitle(isFarm ? "Farm Order" : "Digout Order")
      .setDescription(description)
      .setColor(isFarm ? 0x5865f2 : 0xed4245)
      .setTimestamp()
      .setFooter({ text: "Claude's Bot • Build Services" });

    const closeBtn = new ButtonBuilder()
      .setCustomId("close_ticket")
      .setLabel("Close Ticket")
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder().addComponents(closeBtn);
    const ping = STAFF_ROLE_ID ? `<@&${STAFF_ROLE_ID}>` : "";

    await ticketChannel.send({
      content: `${interaction.user} ${ping}`,
      embeds: [ticketEmbed],
      components: [row],
    });

    await interaction.reply({
      content: `✅ Your ticket has been opened: ${ticketChannel}`,
      ephemeral: true,
    });
  }
});

client.login(TOKEN);
