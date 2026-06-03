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
const TOKEN = process.env.DISCORD_TOKEN; // set this in your environment
const STAFF_ROLE_ID = process.env.STAFF_ROLE_ID; // role to ping in tickets
const TICKET_CATEGORY_ID = process.env.TICKET_CATEGORY_ID; // optional category for tickets
// ─────────────────────────────────────────────────────────────────────────────

client.once(Events.ClientReady, () => {
  console.log(`✅ Claude's Bot is online as ${client.user.tag}`);
});

// Post the shop panel with !panel command
client.on(Events.MessageCreate, async (message) => {
  if (message.content === "!panel" && message.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
    const embed = new EmbedBuilder()
      .setTitle("🤖 Claude's Bot — Shop")
      .setDescription(
        [
          "**Buying:** *(We Sell To You)*",
          "🦴 Skeleton Spawners — **10 each**",
          "",
          "**Selling:** *(You Sell To Us)*",
          "🦴 Skeleton Spawners — **5.3 each**",
          "📦 Stock: **1737 spawners available**",
          "",
          "━━━━━━━━━━━━━━━━━━━━━━━━",
          "",
          "**📋 Rules**",
          "• 32 spawners minimum to Sell or Buy",
          "• We do **NOT** go first",
          "• We do **NOT** negotiate on prices",
          "⚠️ Failure to complete trades may result in a **ban**",
          "",
          "Open a ticket below to sell or buy spawners.",
        ].join("\n")
      )
      .setColor(0x5865f2)
      .setFooter({ text: "Claude's Bot" })
      .setTimestamp();

    const sellBtn = new ButtonBuilder()
      .setCustomId("sell_spawners")
      .setLabel("🦴 Sell Spawners")
      .setStyle(ButtonStyle.Success);

    const buyBtn = new ButtonBuilder()
      .setCustomId("buy_spawners")
      .setLabel("🦴 Buy Spawners")
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(sellBtn, buyBtn);

    await message.channel.send({ embeds: [embed], components: [row] });
    await message.delete().catch(() => {});
  }
});

// Handle button clicks
client.on(Events.InteractionCreate, async (interaction) => {
  // ── Buttons → open modal ──────────────────────────────────────────────────
  if (interaction.isButton()) {
    const isBuy = interaction.customId === "buy_spawners";
    const isSell = interaction.customId === "sell_spawners";
    if (!isBuy && !isSell) return;

    const modal = new ModalBuilder()
      .setCustomId(isBuy ? "modal_buy" : "modal_sell")
      .setTitle(isBuy ? "Buy Spawners" : "Sell Spawners");

    const ignInput = new TextInputBuilder()
      .setCustomId("ign")
      .setLabel("IGN")
      .setStyle(TextInputStyle.Short)
      .setRequired(true);

    const amountInput = new TextInputBuilder()
      .setCustomId("amount")
      .setLabel("How many skeleton spawners?")
      .setStyle(TextInputStyle.Short)
      .setPlaceholder("100")
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(ignInput),
      new ActionRowBuilder().addComponents(amountInput)
    );

    await interaction.showModal(modal);
  }

  // ── Modal submit → create ticket channel ─────────────────────────────────
  if (interaction.isModalSubmit()) {
    const isBuy = interaction.customId === "modal_buy";
    const ign = interaction.fields.getTextInputValue("ign");
    const amount = interaction.fields.getTextInputValue("amount");
    const type = isBuy ? "buy" : "sell";

    const guild = interaction.guild;

    // Check for existing ticket
    const existing = guild.channels.cache.find(
      (c) => c.name === `${type}-${interaction.user.username.toLowerCase()}`
    );
    if (existing) {
      return interaction.reply({
        content: `❌ You already have an open ticket: ${existing}`,
        ephemeral: true,
      });
    }

    // Build permission overwrites
    const overwrites = [
      {
        id: guild.id,
        deny: [PermissionFlagsBits.ViewChannel],
      },
      {
        id: interaction.user.id,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ReadMessageHistory,
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

    // Send ticket embed
    const ticketEmbed = new EmbedBuilder()
      .setTitle(isBuy ? "🛒 Buy Order" : "💰 Sell Order")
      .setDescription(
        [
          `**User:** ${interaction.user}`,
          `**IGN:** \`${ign}\``,
          `**Amount:** \`${amount} spawners\``,
          `**Type:** ${isBuy ? "Buying from us" : "Selling to us"}`,
          "",
          isBuy
            ? `💸 Estimated cost: **${(parseInt(amount) * 10).toLocaleString()} coins**`
            : `💸 Estimated payout: **${(parseFloat(amount) * 5.3).toLocaleString()} coins**`,
          "",
          "A staff member will be with you shortly.",
        ].join("\n")
      )
      .setColor(isBuy ? 0x5865f2 : 0x57f287)
      .setTimestamp()
      .setFooter({ text: "Claude's Bot • Ticket System" });

    const closeBtn = new ButtonBuilder()
      .setCustomId("close_ticket")
      .setLabel("🔒 Close Ticket")
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

  // ── Close ticket button ───────────────────────────────────────────────────
  if (interaction.isButton() && interaction.customId === "close_ticket") {
    await interaction.reply({ content: "🔒 Closing ticket in 5 seconds..." });
    setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
  }
});

client.login(TOKEN);
