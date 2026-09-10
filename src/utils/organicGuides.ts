export interface OrganicGuideDetails {
  name: string;
  type: string;
  dosage: string;
  benefit: string;
  timing: string;
  shelfLife: string;
  prepSteps: { label: string; desc: string }[];
  applicationMethod: string;
  precautions: string[];
}

export function getOrganicPreparationDetails(alt: { name: string; type: string; dosage: string; benefit: string }): OrganicGuideDetails {
  const n = alt.name.toLowerCase();

  if (n.includes('vermicompost')) {
    return {
      name: alt.name,
      type: alt.type,
      dosage: alt.dosage,
      benefit: alt.benefit,
      timing: 'Basal application during land preparation or root trenching',
      shelfLife: '45–60 days in cool shaded storage',
      prepSteps: [
        { label: 'Substrate & Bed Setup', desc: 'Layer decomposed cow dung, crop residue, and dry leaves in a 3m x 1m shaded pit. Maintain 60–70% moisture.' },
        { label: 'Earthworm Inoculation', desc: 'Release healthy Eisenia foetida earthworms (approx. 1 kg per ton of organic biomass) into the moist bed.' },
        { label: 'Aeration & Incubation', desc: 'Keep beds covered with damp gunny bags for 45–60 days. Lightly sprinkle water every 2–3 days without flooding.' },
        { label: 'Harvesting & Sieving', desc: 'Stop watering 5 days before harvest. Scrape dark brown, odor-free granular worm castings and sift through 3mm sieve.' },
        { label: 'Bio-Enrichment (Optional)', desc: 'Blend with 2 kg Trichoderma or PSB per ton 7 days before application to multiply beneficial soil microflora.' }
      ],
      applicationMethod: 'Broadcast evenly over moist field during final harrowing, or apply 200g–500g per plant basin directly into root zone and cover with mulch.',
      precautions: [
        'Never expose vermicompost to direct harsh sunlight or heat; UV rays kill earthworms and beneficial bacteria.',
        'Avoid mixing with synthetic chemical insecticides or high-salinity concentrated fertilizers.',
        'Ensure moisture stays between 50–60% during storage under burlap sacks.'
      ]
    };
  }

  if (n.includes('jeevamrutha') || n.includes('jeevamrit')) {
    return {
      name: alt.name,
      type: alt.type,
      dosage: alt.dosage,
      benefit: alt.benefit,
      timing: 'Every 14–21 days during active vegetative growth and flowering',
      shelfLife: 'Best within 48–120 hours of fermentation',
      prepSteps: [
        { label: 'Drum Setup', desc: 'Take 200 Litres of chlorine-free borewell or well water in a food-grade plastic barrel placed under tree shade.' },
        { label: 'Base Mix Addition', desc: 'Add 10 kg fresh indigenous (desi) cow dung and 5–10 Litres fresh desi cow urine. Stir thoroughly with a wooden pole.' },
        { label: 'Microbial Nourishment', desc: 'Add 2 kg organic jaggery (dissolved in water) and 2 kg pulse flour (gram flour / besan) to feed multiplying aerobic microbes.' },
        { label: 'Native Inoculum', desc: 'Add 100g of virgin forest soil or undisturbed field bund soil containing billions of native symbiotic microorganisms.' },
        { label: 'Fermentation Protocol', desc: 'Stir clockwise with a wooden stick 2–3 times a day for 10 minutes. Keep covered with a damp jute bag for 48 to 72 hours.' }
      ],
      applicationMethod: 'Apply 200 L/acre directly through irrigation canals, venturi drip injectors, or strain through fine cloth for 10% foliar spray.',
      precautions: [
        'Do not store in an airtight container; fermentation generates carbon dioxide which requires breathable jute cover.',
        'Never leave in direct sun; UV light and high temperatures (>38°C) destroy live microbial populations.',
        'Use within 7 days; efficacy drops after 8 days as microbial food depletes.'
      ]
    };
  }

  if (n.includes('neem')) {
    return {
      name: alt.name,
      type: alt.type,
      dosage: alt.dosage,
      benefit: alt.benefit,
      timing: 'Basal soil incorporation 7–10 days before sowing/transplanting',
      shelfLife: '6–12 months in dry airtight storage',
      prepSteps: [
        { label: 'Quality Verification', desc: 'Source cold-pressed pure de-oiled neem cake containing minimum 2–4% residual neem oil and 4–5% organic Nitrogen.' },
        { label: 'Pulverization & Aeration', desc: 'Crush any hard compacted blocks into uniform granular powder (mesh 20–40) to maximize root contact area.' },
        { label: 'Compost Co-Blending', desc: 'Mix 1 part neem powder with 2 parts well-rotted FYM or vermicompost 24 hours prior to application for uniform field distribution.' },
        { label: 'Soil Incorporation', desc: 'Spread into root furrows and lightly disc or till into top 10–15 cm of soil before irrigation.' }
      ],
      applicationMethod: 'Deep placement around root trenches (10–15 cm depth) or broadcast before final plowing followed by light wetting.',
      precautions: [
        'Incorporate into soil immediately after broadcast; direct UV exposure degrades active Azadirachtin terpenes.',
        'Store bags on raised wooden pallets off concrete floors to avoid moisture absorption and premature mold.',
        'Do not exceed recommended dosage in tender nursery seedlings.'
      ]
    };
  }

  if (n.includes('trichoderma')) {
    return {
      name: alt.name,
      type: alt.type,
      dosage: alt.dosage,
      benefit: alt.benefit,
      timing: 'Basal incorporation before sowing or root drench at first signs of fungal disease',
      shelfLife: 'Use within 15–20 days of multiplication',
      prepSteps: [
        { label: 'Carrier Medium Prep', desc: 'Spread 100 kg of well-composted, moist Farmyard Manure (FYM) or vermicompost under tree shade.' },
        { label: 'Inoculation', desc: 'Mix 1–2 kg Trichoderma viride / harzianum powder into 10 L water and sprinkle evenly across the compost heap.' },
        { label: 'Incubation & Moisture', desc: 'Mix thoroughly, heap into a 1-meter high pile, and cover with wet gunny bags. Maintain 40–50% moisture at 25–30°C.' },
        { label: 'Multiplication Check', desc: 'Turn heap once on Day 4. By Day 7–10, green fungal hyphae will blanket the compost, signaling optimal readiness.' }
      ],
      applicationMethod: 'Incorporate 200–500 kg/acre into root zone or seed furrows, or mix 5g/L water for direct collar soil drenching.',
      precautions: [
        'Strictly avoid applying chemical fungicides (Mancozeb, Carbendazim, Hexaconazole) within 15 days of application.',
        'Never expose inoculated compost to direct sunlight or drying winds.',
        'Ensure soil is moist when applying; bio-agents require soil moisture to colonize rhizosphere.'
      ]
    };
  }

  if (n.includes('panchagavya')) {
    return {
      name: alt.name,
      type: alt.type,
      dosage: alt.dosage,
      benefit: alt.benefit,
      timing: 'Vegetative growth flush, pre-flowering, and early fruit formation',
      shelfLife: '60 days when stirred twice daily in shade',
      prepSteps: [
        { label: 'Phase 1 - Ghee & Dung', desc: 'Blend 5 kg fresh desi cow dung with 1 kg pure cow ghee in a wide plastic barrel. Keep 3 days, stirring twice daily.' },
        { label: 'Phase 2 - Organic Additions', desc: 'On day 4, add 3L cow urine, 2L cow milk, 2L cow curd, 3L coconut water, 3L sugarcane juice, and 12 ripe mashed bananas.' },
        { label: 'Fermentation Period', desc: 'Cover barrel with muslin cloth. Stir clockwise and anti-clockwise for 15 minutes twice daily for 15–18 days.' },
        { label: 'Cloth Filtration', desc: 'Filter concentrated liquid through double-layered cotton cloth to obtain smooth, spray-grade botanical tonic.' }
      ],
      applicationMethod: 'Foliar spray at 3% concentration (300 ml in 10 Litres water) in early morning or late afternoon; or 20 L/acre via drip.',
      precautions: [
        'Never use metal drums (iron, copper, brass) for preparation or storage; use food-grade plastic or clay urns.',
        'Do not exceed 3% concentration on young foliage to prevent leaf margin tip burn.',
        'Spray during cool morning (7–9 AM) or evening (4–6 PM) hours.'
      ]
    };
  }

  if (n.includes('rhizobium') || n.includes('azotobacter') || n.includes('psb')) {
    return {
      name: alt.name,
      type: alt.type,
      dosage: alt.dosage,
      benefit: alt.benefit,
      timing: 'Seed treatment immediately prior to sowing or root dip during transplanting',
      shelfLife: '6 months from manufacture date; store below 28°C',
      prepSteps: [
        { label: 'Adhesive Syrup', desc: 'Dissolve 50g organic jaggery in 250ml boiled, cooled clean water to create a mild adhesive syrup.' },
        { label: 'Bio-Inoculant Addition', desc: 'Add 200g of pure biofertilizer culture into cooled syrup and stir into a lump-free uniform slurry.' },
        { label: 'Seed Inoculation', desc: 'Pour slurry over 10–12 kg seeds spread on a clean plastic sheet. Gently coat seeds with hands without cracking seed coats.' },
        { label: 'Shade Drying', desc: 'Spread coated seeds in a thin layer under shade for 30–45 minutes until dry to touch. Sow within 4–6 hours.' }
      ],
      applicationMethod: 'Seed coating (200g/10kg seed), root seedling dip (1kg in 10L water for 20 mins), or soil drenching (2kg mixed in 50kg compost per acre).',
      precautions: [
        'Never expose treated seeds to direct sun or dry winds.',
        'Maintain a 24-hour gap after any chemical pesticide seed dressing before bio-inoculation.',
        'Ensure soil has sufficient moisture during sowing for bacteria survival.'
      ]
    };
  }

  if (n.includes('fym') || n.includes('farmyard manure')) {
    return {
      name: alt.name,
      type: alt.type,
      dosage: alt.dosage,
      benefit: alt.benefit,
      timing: 'Apply 2–3 weeks prior to sowing during initial deep ploughing',
      shelfLife: 'Up to 6 months once fully cured in covered pit',
      prepSteps: [
        { label: 'Pit Excavation', desc: 'Dig a compost pit (3m x 1.5m x 1m) in a raised, shaded corner of the farm to prevent rain runoff ingress.' },
        { label: 'Layering Biomass', desc: 'Alternate 15 cm layers of cattle dung, urine-soaked straw/bedding, and chopped green agricultural waste.' },
        { label: 'Aerobic Turning', desc: 'Maintain moisture around 50–60%. Turn the pile every 30 days to aerate and equalize internal compost temperature.' },
        { label: 'Curing Verification', desc: 'Ready when manure turns dark crumbly black, smells like fresh forest humus, and has zero pungent ammonia smell.' }
      ],
      applicationMethod: 'Broadcast uniformly across field at 4–5 tonnes/acre and harrow immediately into top 15 cm soil before sunlight dries organic carbon.',
      precautions: [
        'Never use raw, fresh cow dung; unfermented manure releases high heat and ammonia that scorches roots and attracts white grubs.',
        'Cover pit with a polythene sheet during heavy monsoons to prevent nutrient leaching.'
      ]
    };
  }

  if (n.includes('castor') || n.includes('mustard')) {
    return {
      name: alt.name,
      type: alt.type,
      dosage: alt.dosage,
      benefit: alt.benefit,
      timing: 'Basal application 10–14 days prior to planting or at earthing-up',
      shelfLife: '8–12 months in moisture-free bags',
      prepSteps: [
        { label: 'Crushing & Sizing', desc: 'Crush expeller cake slabs into small granules (2–4 mm) for uniform broadcasting and steady soil release.' },
        { label: 'Pre-Incubation', desc: 'Mix crushed cake with 20% moist compost and sprinkle water 48 hours prior to application to initiate microbial colonization.' },
        { label: 'Furrow Distribution', desc: 'Apply along planting rows 5–8 cm away from plant stem and 8–10 cm deep.' },
        { label: 'Soil Incorporation', desc: 'Cover with soil and provide immediate irrigation to initiate organic nitrogen mineralisation.' }
      ],
      applicationMethod: 'Soil placement along planting furrows at 150–200 kg/acre followed by light watering.',
      precautions: [
        'Keep domestic livestock and dogs away from castor cake storage as raw castor cake contains ricin toxic to animals.',
        'Store in elevated dry storehouse away from humid ground moisture.'
      ]
    };
  }

  // Fallback for bio-potash, pressmud, cane trash mulch, gluconacetobacter, or any other organic product
  return {
    name: alt.name,
    type: alt.type,
    dosage: alt.dosage,
    benefit: alt.benefit,
    timing: 'Apply during vegetative growth or field preparation',
    shelfLife: '4–6 months in cool, dry storage',
    prepSteps: [
      { label: 'Raw Material Selection', desc: `Ensure authenticated high-grade organic ${alt.name} meeting biological quality standards.` },
      { label: 'Moisture Conditioning', desc: 'Moisten slightly with clean water and blend with 50 kg farmyard manure or vermicompost 24 hours before use.' },
      { label: 'Application Staging', desc: 'Apply during early morning or late afternoon when soil temperature is moderate and microbial vitality is preserved.' },
      { label: 'Field Integration', desc: `Incorporate recommended dosage of ${alt.dosage} thoroughly into root zone and irrigate appropriately.` }
    ],
    applicationMethod: `Distribute ${alt.dosage} evenly into rhizosphere or root zone, followed by light irrigation to ensure rapid biological assimilation.`,
    precautions: [
      'Store in a cool, ventilated area away from direct sunlight and moisture.',
      'Do not mix with concentrated chemical fertilizers or systemic fungicides at the same time.',
      'Apply to moist soil for optimal biological activation.'
    ]
  };
}
