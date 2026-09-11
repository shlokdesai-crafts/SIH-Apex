"""
backend/ml/advisory.py
───────────────────────
Controlled, expert-curated advisory layer for crop disease identification.
Contains deterministic explanations, field symptoms, cultural management actions,
and preventative guidelines for Sugarcane, Soybean, and future crops.

Strict Rule: No AI-generated pesticide dosages or hallucinated chemical prescriptions.
"""

from typing import Dict, Any, List

ADVISORY_DATABASE: Dict[str, Dict[str, Dict[str, Any]]] = {
    "Sugarcane": {
        "Healthy": {
            "explanation": "The sugarcane leaf exhibits vibrant chlorophyll pigmentation, robust midrib structure, and zero symptoms of fungal or viral infection.",
            "symptoms": [
                "Uniform deep green leaf lamina",
                "Clean central midrib with no discoloration",
                "Intact leaf margins free of lesions or rust pustules"
            ],
            "recommended_actions": [
                "Maintain scheduled nitrogen and potassium fertigation cycles",
                "Monitor canopy density and maintain field drainage",
                "Conduct routine bi-weekly leaf inspections"
            ],
            "prevention": [
                "Use certified disease-free setts for planting",
                "Practice proper crop rotation with leguminous green manure"
            ]
        },
        "Red Rot": {
            "explanation": "Red Rot (caused by Colletotrichum falcatum) is a severe fungal vascular disease causing stalk drying, internal red lesions, and midrib reddening.",
            "symptoms": [
                "Elongated red lesions along the upper leaf midrib",
                "Stalk tissues exhibiting reddish discoloration with white cross-bands",
                "Withered third and fourth leaves turning yellowish-red"
            ],
            "recommended_actions": [
                "Uproot and burn affected clumps immediately to prevent spore dispersal",
                "Avoid using setts from infected fields for future planting",
                "Ensure proper field drainage to minimize standing moisture"
            ],
            "prevention": [
                "Plant red-rot resistant sugarcane varieties (e.g., Co 86032 / Co 0238 where recommended)",
                "Treat seed setts with moist hot air or biological Trichoderma inoculants",
                "Follow a 2 to 3-year crop rotation schedule"
            ]
        },
        "Rust": {
            "explanation": "Sugarcane Rust (Puccinia melanocephala) is a foliar fungal disease forming reddish-brown powdery pustules along leaf veins.",
            "symptoms": [
                "Small yellowish elongated spots developing into reddish-brown pustules",
                "Ruptured leaf epidermis releasing orange-brown spores",
                "Premature leaf drying under heavy infection"
            ],
            "recommended_actions": [
                "Promote row aeration by removing lower dry senescent leaves (stripping)",
                "Avoid excessive nitrogen fertilization which creates lush susceptible foliage",
                "Scout fields weekly during warm humid weather"
            ],
            "prevention": [
                "Cultivate rust-resistant sugarcane cultivars",
                "Maintain optimal plant density and row spacing to enhance airflow"
            ]
        },
        "Mosaic": {
            "explanation": "Sugarcane Mosaic Virus (SCMV) causes chlorotic streak patterns across leaf blades, reducing photosynthesis and stalk weight.",
            "symptoms": [
                "Contrasting light green or yellow chlorotic streaks on green leaf lamina",
                "Mottled pattern more prominent on young expanding leaves",
                "Stunted stool growth in severe infections"
            ],
            "recommended_actions": [
                "Rogue out and destroy infected young plants early in the season",
                "Monitor and control aphid vectors using sticky traps and field sanitation",
                "Disinfect harvesting knives between fields"
            ],
            "prevention": [
                "Plant virus-free tissue culture seed setts",
                "Keep field borders clean of wild grassy weeds that host SCMV"
            ]
        },
        "Yellow Disease": {
            "explanation": "Sugarcane Yellow Leaf Disease (SCYLV) causes intense yellowing of the leaf midrib and lamina, impairing sucrose accumulation.",
            "symptoms": [
                "Bright yellowing of the lower leaf midrib on the 3rd to 6th leaves",
                "Yellowing spreading sideways into the leaf lamina",
                "Stalk shortening and apical leaf bunching in advanced stages"
            ],
            "recommended_actions": [
                "Remove and burn symptomatic stools to curb aphid-mediated transmission",
                "Apply balanced N-P-K nutrients to support plant immunity"
            ],
            "prevention": [
                "Use SCYLV-certified seed material from nursery plots",
                "Practice strict weed control along field margins"
            ]
        }
    },
    "Soybean": {
        "Healthy": {
            "explanation": "The soybean plant displays healthy trifoliate leaves with uniform green color, smooth margins, and robust cellular structure.",
            "symptoms": [
                "Deep green trifoliate leaves without chlorotic patches",
                "Smooth leaf surfaces free from spots, pustules, or leaf puckering",
                "Healthy branch and pod development"
            ],
            "recommended_actions": [
                "Continue standard soil moisture management",
                "Maintain balanced soil fertility (Phosphorus & Potassium supplementation)"
            ],
            "prevention": [
                "Plant certified high-germination, disease-resistant seed varieties",
                "Practice regular field crop rotation"
            ]
        },
        "Cercospora Leaf Blight": {
            "explanation": "Cercospora Leaf Blight (Cercospora kikuchii) causes bronze-purple foliage discoloration, leathery leaf texture, and premature leaf drop.",
            "symptoms": [
                "Reddish-purple to bronze discoloration on upper leaves exposed to sunlight",
                "Leathery, thickened texture of affected leaves",
                "Blighting and premature defoliation starting from top canopy"
            ],
            "recommended_actions": [
                "Harvest fields promptly at maturity to avoid seed quality decay",
                "Incorporate crop residues into soil post-harvest to speed up decomposition"
            ],
            "prevention": [
                "Rotate fields with corn, sorghum, or small grains",
                "Use pathogen-free certified seeds"
            ]
        },
        "Frogeye Leaf Spot": {
            "explanation": "Frogeye Leaf Spot (Cercospora sojina) produces circular lesions with tan-gray centers and dark reddish-brown borders on leaves.",
            "symptoms": [
                "Circular to angular spots (1-5 mm) with tan or gray centers",
                "Narrow, dark reddish-brown borders surrounding each lesion",
                "Lesions merging to form large dead necrotic areas under wet conditions"
            ],
            "recommended_actions": [
                "Avoid overhead sprinkler irrigation during warm humid weather",
                "Deep plow crop residue after harvest to reduce overwintering fungi"
            ],
            "prevention": [
                "Plant frogeye-resistant soybean cultivars",
                "Implement a 2-year crop rotation out of soybeans"
            ]
        },
        "Rust": {
            "explanation": "Asian Soybean Rust (Phakopsora pachyrhizi) is an aggressive fungal pathogen producing tiny tan-to-reddish pustules on lower leaf surfaces.",
            "symptoms": [
                "Tiny raised pustules (uredinia) on lower leaf surface",
                "Yellowing of affected leaves starting from the lower canopy upwards",
                "Rapid, premature leaf loss reducing pod fill"
            ],
            "recommended_actions": [
                "Scout lower leaf canopy twice weekly during flowering and pod development",
                "Notify regional extension services upon early detection"
            ],
            "prevention": [
                "Plant early-maturing soybean varieties to escape late-season spore buildup",
                "Maintain optimal row spacing for canopy ventilation"
            ]
        },
        "Yellow Mosaic": {
            "explanation": "Soybean Yellow Mosaic Virus (transmitted by Bemisia tabaci whiteflies) causes bright yellow mosaic mottling and leaf distortion.",
            "symptoms": [
                "Bright yellow patches interspersed with green areas on leaves",
                "Puckering, crinkling, and reduction in leaf size",
                "Stunted plant growth and reduced pod formation"
            ],
            "recommended_actions": [
                "Rogue out yellow mosaic-infected plants during early growth stages",
                "Deploy yellow sticky traps to capture whitefly vectors"
            ],
            "prevention": [
                "Maintain weed-free field borders to eliminate whitefly host plants",
                "Sow whitefly-tolerant or resistant soybean varieties"
            ]
        }
    },
    "Rice": {
        "Healthy": {
            "explanation": "The rice plant exhibits uniform green, erect leaves without chlorotic spots, rust lesions, or leaf tip drying.",
            "symptoms": [
                "Vibrant green leaf blades with clear parallel venation",
                "Clean sheath and collar free of discoloration",
                "Erect, healthy tiller structure"
            ],
            "recommended_actions": [
                "Maintain optimal water submergence levels for the growth stage",
                "Apply balanced nitrogen splitting to avoid excessive vegetation"
            ],
            "prevention": [
                "Use certified disease-free seeds from trusted nurseries",
                "Maintain field sanitation and manage crop residue"
            ]
        },
        "Bacterial Leaf Blight": {
            "explanation": "Bacterial Leaf Blight (caused by Xanthomonas oryzae pv. oryzae) causes water-soaked to yellowish lesions starting from leaf tips and margins, expanding into systemic wilting (kresek).",
            "symptoms": [
                "Water-soaked lesions on leaf margins turning pale yellow to white",
                "Wavy, blighted leaf margins with milky bacterial ooze beads early in the morning",
                "Drying and wilting of affected leaves (kresek symptom in young plants)"
            ],
            "recommended_actions": [
                "Drain the field temporarily to reduce bacterial spread via standing water",
                "Avoid top-dressing with high nitrogen fertilizer during disease outbreak",
                "Remove and burn severely infected tillers"
            ],
            "prevention": [
                "Plant resistant rice varieties (e.g., IR64 derivatives or recommended local cultivars)",
                "Avoid deep flooding of seedlings and high plant density",
                "Ensure proper drainage and clean cultivation tools"
            ]
        },
        "Blast": {
            "explanation": "Rice Blast (caused by Magnaporthe oryzae) causes spindle-shaped lesions with grayish-white centers and reddish-brown borders on leaves (Leaf Blast) and neck rotting (Neck Blast).",
            "symptoms": [
                "Spindle- or diamond-shaped lesions with grayish centers and brown/reddish borders",
                "Lesions coalescing causing complete leaf browning and desiccation",
                "Dark brown lesions on leaf collars and panicle necks (neck rot)"
            ],
            "recommended_actions": [
                "Maintain adequate field water levels as moisture stress increases blast susceptibility",
                "Refrain from applying excess nitrogenous fertilizer",
                "Rogue out severely affected plants early in the infection"
            ],
            "prevention": [
                "Use blast-resistant varieties and certified seeds",
                "Treat seeds with biological antagonists or approved seed dressers before sowing",
                "Avoid late planting and high sowing density"
            ]
        },
        "Brown Spot": {
            "explanation": "Brown Spot (caused by Bipolaris oryzae) causes numerous small circular to oval brown lesions across leaf surfaces, often indicating nutritional stress or poor soil fertility.",
            "symptoms": [
                "Small, circular to oval dark brown spots on leaf blades",
                "Older lesions featuring grayish centers surrounded by a yellow halo",
                "Widespread spotting causing premature leaf senescence and poor seed filling"
            ],
            "recommended_actions": [
                "Apply balanced fertilizers containing potassium, silicon, and micronutrients",
                "Ensure proper field irrigation to reduce plant water stress",
                "Incorporate soil amendments to correct nutrient deficiencies"
            ],
            "prevention": [
                "Use healthy, certified seed and perform seed hot-water or hot-air treatment",
                "Improve soil health and organic matter content",
                "Practice crop rotation and proper field drainage post-harvest"
            ]
        },
        "Tungro": {
            "explanation": "Rice Tungro Disease (caused by a combination of Rice Tungro Spherical Virus and Rice Tungro Bacilliform Virus, vectored by green leafhoppers) causes plant stunting and bright yellow-orange leaf discoloration.",
            "symptoms": [
                "Bright yellow to orange discoloration of leaf blades starting from tips",
                "Severe plant stunting and reduced tillering",
                "Delayed flowering and dark brown specks on leaves"
            ],
            "recommended_actions": [
                "Rogue out and destroy infected tillers/stools immediately",
                "Monitor and control green leafhopper (Nephotettix spp.) vector populations",
                "Synchronize planting dates within the farming cluster to interrupt vector lifecycle"
            ],
            "prevention": [
                "Plant tungro-resistant varieties",
                "Plow under stubble immediately after harvest to eliminate viral reservoirs",
                "Maintain clean field borders free from weed hosts"
            ]
        }
    },
    "Cotton": {
        "Healthy": {
            "explanation": "The cotton plant features healthy 3-to-5 lobed leaves with vibrant green coloration, intact palisade cells, and no necrotic lesions.",
            "symptoms": [
                "Uniform dark green lobed foliage",
                "Clean leaf veins without angular water-soaked spots",
                "Robust square and boll formation"
            ],
            "recommended_actions": [
                "Maintain balanced irrigation schedules during squaring and flowering",
                "Monitor soil potassium and phosphorus availability"
            ],
            "prevention": [
                "Use certified disease-free seeds",
                "Practice crop rotation with non-host grass crops"
            ]
        },
        "Bacterial Blight": {
            "explanation": "Bacterial Blight (Xanthomonas citri pv. malvacearum) causes angular water-soaked spots bounded by leaf veins, black arm stem lesions, and boll rot.",
            "symptoms": [
                "Angular, dark green water-soaked spots on lower leaf surface",
                "Lesions turning brown to black with age",
                "Blackening and girdling of main stems (black arm)"
            ],
            "recommended_actions": [
                "Avoid overhead sprinkler irrigation that disperses bacteria",
                "Destroy severely infected crop residues after harvest",
                "Avoid working in wet fields to prevent spread"
            ],
            "prevention": [
                "Plant blight-resistant cotton varieties",
                "Perform delinting and seed acid-treatment prior to sowing",
                "Implement strict field sanitation"
            ]
        },
        "Curl Virus": {
            "explanation": "Cotton Leaf Curl Virus (CLCuV, vectored by Bemisia tabaci whiteflies) causes upward leaf curling, vein thickening, and leaf-like enations on lower leaf surfaces.",
            "symptoms": [
                "Upward or downward leaf curling and thickening of veins",
                "Small leaf-like outgrowths (enations) on the underside of main veins",
                "Severe plant stunting and flower/boll drop"
            ],
            "recommended_actions": [
                "Rogue out and destroy viral infected plants in early growth",
                "Deploy yellow sticky traps to capture whitefly vectors",
                "Maintain clean borders free of malvaceous weeds"
            ],
            "prevention": [
                "Sow CLCuV-resistant or tolerant cotton cultivars",
                "Avoid continuous cotton cropping near vegetable whitefly hosts",
                "Practice early uniform sowing"
            ]
        },
        "Fusarium Wilt": {
            "explanation": "Fusarium Wilt (Fusarium oxysporum f. sp. vasinfectum) is a soil-borne vascular fungal disease causing leaf yellowing, wilting, and dark brown vascular ring discoloration inside stems.",
            "symptoms": [
                "Yellowing of leaf margins progressing inward between main veins",
                "Wilting and leaf drop starting from lower canopy upward",
                "Dark brown to black ring discoloration inside stem cross-sections"
            ],
            "recommended_actions": [
                "Uproot and burn wilted plants to prevent soil spore buildup",
                "Improve field drainage and prevent waterlogging",
                "Apply organic soil amendments and bio-control inoculants"
            ],
            "prevention": [
                "Plant wilt-resistant cotton varieties",
                "Rotate fields with non-susceptible crops like sorghum or maize for 3+ years",
                "Maintain optimal soil pH and potassium balance"
            ]
        },
        "Target Spot": {
            "explanation": "Target Spot (Corynespora cassiicola) produces circular to irregular leaf spots featuring distinct concentric target-like rings, causing rapid lower canopy defoliation.",
            "symptoms": [
                "Circular spots with alternating light and dark brown concentric rings",
                "Target-like lesion pattern with yellow halo",
                "Premature defoliation starting in dense lower canopy"
            ],
            "recommended_actions": [
                "Manage canopy density by adjusting nitrogen fertilization",
                "Promote air circulation within rows through proper plant spacing"
            ],
            "prevention": [
                "Rotate crops with non-host species",
                "Clean and destroy infected crop residues post-harvest"
            ]
        }
    },
    "Wheat": {
        "Healthy": {
            "explanation": "The wheat crop exhibits healthy green erect leaves, intact parallel leaf venation, robust tiller formation, and clean glumes without fungal rust or mildew lesions.",
            "symptoms": [
                "Uniform green leaf blades without chlorotic stripes or rust pustules",
                "Clean leaf sheaths, stems, and spikes free of fungal coating",
                "Robust erect growth during tillering and heading stages"
            ],
            "recommended_actions": [
                "Maintain optimal irrigation during critical tillering and flowering stages",
                "Apply balanced nitrogen, phosphorus, and potassium split doses"
            ],
            "prevention": [
                "Plant high-germination, disease-resistant certified wheat seed",
                "Maintain proper crop rotation with non-cereal crops"
            ]
        },
        "Brown Rust": {
            "explanation": "Brown Rust / Leaf Rust (Puccinia triticina) is a major foliar fungal disease forming small, circular orange-brown pustules randomly scattered across upper leaf surfaces.",
            "symptoms": [
                "Small, circular orange-to-brown pustules (uredinia) scattered randomly on upper leaf surfaces",
                "Ruptured leaf epidermis exposing powdery brown spores",
                "Leaf chlorosis and premature leaf desiccation under heavy infection"
            ],
            "recommended_actions": [
                "Avoid late sowing which exposes crops to warm temperature rust spore buildup",
                "Destroy volunteer wheat plants and grassy weeds along field borders",
                "Scout fields weekly during boot and flag leaf stages"
            ],
            "prevention": [
                "Sow rust-resistant wheat varieties recommended for the agro-climatic zone",
                "Practice early uniform sowing and balanced nitrogen management"
            ]
        },
        "Yellow Rust": {
            "explanation": "Yellow Rust / Stripe Rust (Puccinia striiformis f. sp. tritici) causes vivid yellow powdery pustules arranged in prominent linear stripes along leaf veins in cool weather.",
            "symptoms": [
                "Bright yellow powdery pustules arranged in distinct parallel stripes along leaf veins",
                "Yellowing and drying of flag leaves from tips downward",
                "Black teliospores forming in dark linear stripes late in season"
            ],
            "recommended_actions": [
                "Inspect fields closely during cool, moist spring weather",
                "Rogue early infected spots if localized in small patches",
                "Avoid over-application of nitrogenous fertilizers"
            ],
            "prevention": [
                "Plant stripe rust-resistant wheat cultivars",
                "Destroy self-sown volunteer wheat plants post-harvest"
            ]
        },
        "Powdery Mildew": {
            "explanation": "Powdery Mildew (Blumeria graminis f. sp. tritici) produces white-to-grayish powdery fungal patches on lower leaves, stems, and leaf sheaths.",
            "symptoms": [
                "Fluffy white-to-light gray powdery fungal colonies on leaves and stems",
                "Patches turning dull gray with tiny black fruiting bodies (cleistothecia)",
                "Yellowing and premature drying of lower foliage"
            ],
            "recommended_actions": [
                "Promote canopy ventilation by avoiding excessively dense seed rates",
                "Maintain proper field drainage to lower microclimate humidity"
            ],
            "prevention": [
                "Cultivate mildew-resistant wheat varieties",
                "Practice crop rotation with non-graminaceous crops"
            ]
        },
        "Septoria": {
            "explanation": "Septoria Tritici Blight (Zymoseptoria tritici / Septoria tritici) causes irregular rectangular brown lesions containing tiny black specks (pycnidia) along leaf blades.",
            "symptoms": [
                "Elongated, rectangular brown necrotic lesions parallel to leaf veins",
                "Tiny black speckles (pycnidia) visible inside mature gray-brown lesions",
                "Blighting and death of important upper flag leaves"
            ],
            "recommended_actions": [
                "Incorporate or bury wheat stubble post-harvest to reduce spore survival",
                "Avoid overhead irrigation during flag leaf emergence"
            ],
            "prevention": [
                "Use certified disease-free seed material",
                "Rotate wheat with broadleaf crops like pulses or oilseeds"
            ]
        }
    },
    "Maize": {
        "Healthy": {
            "explanation": "The maize plant exhibits robust broad leaf blades, deep green chlorophyll pigmentation, healthy central leaf midribs, and zero signs of fungal blights or viral streaks.",
            "symptoms": [
                "Uniform green corn leaf lamina with smooth margins",
                "Clean midrib without reddish streak lesions or gray spots",
                "Healthy stalk and silk/ear development"
            ],
            "recommended_actions": [
                "Maintain adequate moisture during critical tasseling and silking stages",
                "Apply balanced nitrogen splitting to support ear fill"
            ],
            "prevention": [
                "Sow certified hybrid maize seed with high germination vigor",
                "Implement field crop rotation with leguminous crops"
            ]
        },
        "Common Rust": {
            "explanation": "Common Rust (Puccinia sorghi) produces small, brownish-red circular-to-elongated pustules on both upper and lower leaf surfaces, releasing powdery reddish-brown spores.",
            "symptoms": [
                "Golden-brown to cinnamon-red pustules on both upper and lower leaf surfaces",
                "Pustules turning dark brown to black as the plant matures",
                "Leaf yellowing and premature leaf death under high infection pressure"
            ],
            "recommended_actions": [
                "Scout fields regularly during cool, humid weather prior to silking",
                "Ensure proper plant spacing for canopy air movement"
            ],
            "prevention": [
                "Plant rust-resistant hybrid maize cultivars",
                "Practice early sowing to avoid late-season spore flights"
            ]
        },
        "Gray Leaf Spot": {
            "explanation": "Gray Leaf Spot (Cercospora zeae-maydis) causes distinct tan-to-gray rectangular lesions strictly delimited by parallel leaf veins.",
            "symptoms": [
                "Small tan spots expanding into long, narrow rectangular lesions (1-5 cm)",
                "Lesion borders strictly bounded by leaf veins",
                "Blighting and blighting of entire leaves starting from lower canopy"
            ],
            "recommended_actions": [
                "Till and incorporate infected corn stubble into the soil post-harvest",
                "Avoid overhead irrigation during warm, humid conditions"
            ],
            "prevention": [
                "Plant resistant or tolerant maize hybrids",
                "Rotate out of corn for 2 years with soybean or cover crops"
            ]
        },
        "Northern Leaf Blight": {
            "explanation": "Northern Corn Leaf Blight (Exserohilum turcicum) causes large, elliptical cigar-shaped grayish-green to tan lesions across leaf blades.",
            "symptoms": [
                "Large, elongated cigar-shaped lesions (3-15 cm) on leaf blades",
                "Lesions starting grayish-green and maturing to tan with dark fungal spore zones",
                "Extensive leaf destruction leading to severe yield loss if occurring before silking"
            ],
            "recommended_actions": [
                "Deep-plow crop residues to accelerate fungal breakdown",
                "Maintain balanced soil fertility (avoid excessive N, maintain K levels)"
            ],
            "prevention": [
                "Use Northern Leaf Blight-resistant corn hybrids",
                "Follow multi-year crop rotations with non-host crops"
            ]
        },
        "Maize Streak Virus": {
            "explanation": "Maize Streak Virus (MSV, vectored by Cicadulina leafhoppers) causes narrow, chlorotic yellow streaks along leaf veins, plant stunting, and cob deformity.",
            "symptoms": [
                "Continuous or broken narrow yellow streaks parallel to leaf veins",
                "Chlorotic spotting and stunting of developing leaves",
                "Severe plant dwarfing and undersized, poorly filled ears"
            ],
            "recommended_actions": [
                "Rogue out and burn infected young maize plants early",
                "Keep field borders clean of wild grassy leafhopper hosts"
            ],
            "prevention": [
                "Plant MSV-certified resistant maize hybrids",
                "Synchronize planting dates within the agricultural cluster"
            ]
        }
    },
    "Tomato": {
        "Healthy": {
            "explanation": "The tomato leaf exhibits healthy compound serrated leaflets, deep green pigmentation, intact glandular trichomes, and zero signs of spots, blight, or viral curling.",
            "symptoms": [
                "Uniform green serrated leaflet blades without yellowing",
                "Clean stems and petioles free of dark sunken lesions",
                "Robust blossom and fruit truss development"
            ],
            "recommended_actions": [
                "Maintain consistent drip irrigation to avoid blossom end rot and stress",
                "Stake and tie tomato plants to keep foliage off wet soil"
            ],
            "prevention": [
                "Plant certified disease-free seedlings from reliable nurseries",
                "Mulch plant bases with clean straw to suppress soil-borne splash"
            ]
        },
        "Bacterial Spot": {
            "explanation": "Bacterial Spot (Xanthomonas spp.) forms small, dark brown water-soaked spots on leaves and stems, often surrounded by yellow halos, causing heavy leaf drop.",
            "symptoms": [
                "Small (2-3 mm) dark, water-soaked spots on leaves turning dark brown or black",
                "Yellow halo developing around dark spots on leaf lamina",
                "Scabby, raised dark spots on green tomato fruits"
            ],
            "recommended_actions": [
                "Avoid overhead sprinkler watering that spreads bacteria across foliage",
                "Prune lower symptomatic branches near the soil line using disinfected shears"
            ],
            "prevention": [
                "Use certified disease-free seeds and heat-treated seedlings",
                "Implement a 2 to 3-year crop rotation away from solanaceous crops"
            ]
        },
        "Early Blight": {
            "explanation": "Early Blight (Alternaria solani) produces dark brown spots with characteristic target-like concentric rings on older lower leaves.",
            "symptoms": [
                "Circular brown spots with distinct concentric target rings on lower leaves",
                "Yellowing of leaf tissue surrounding old target spots",
                "Premature defoliation starting from base of canopy upwards"
            ],
            "recommended_actions": [
                "Remove and destroy severely blighted lower foliage promptly",
                "Ensure proper row spacing to maximize canopy air movement"
            ],
            "prevention": [
                "Plant resistant or tolerant tomato varieties",
                "Apply organic mulch around plant bases to block soil spore splashing"
            ]
        },
        "Late Blight": {
            "explanation": "Late Blight (Phytophthora infestans) is a destructive water-mold disease causing large, water-soaked dark gray-green lesions and white fungal fuzz under humid conditions.",
            "symptoms": [
                "Large, irregular water-soaked pale green-to-dark gray lesions on leaves",
                "White cottony fungal growth on lower leaf surfaces during humid mornings",
                "Dark brown greasy stem lesions and firm brown rot on green fruit"
            ],
            "recommended_actions": [
                "Destroy infected plants immediately to prevent rapid windborne field destruction",
                "Eliminate volunteer tomato plants and nightshade weed hosts"
            ],
            "prevention": [
                "Sow late blight-resistant tomato cultivars",
                "Avoid planting tomatoes adjacent to potato fields"
            ]
        },
        "Yellow Leaf Curl Virus": {
            "explanation": "Tomato Yellow Leaf Curl Virus (TYLCV, vectored by Bemisia tabaci whiteflies) causes severe upward leaf curling, yellowing leaf margins, stunting, and flower abortion.",
            "symptoms": [
                "Upward leaf curling and cupping with prominent yellowing leaf margins",
                "Severe stunting and bushy growth habit of young shoots",
                "Blossom drop and failure to set new tomato fruit"
            ],
            "recommended_actions": [
                "Rogue out and bag infected plants early to kill whiteflies",
                "Install fine insect netting over nursery beds and greenhouse vents"
            ],
            "prevention": [
                "Plant TYLCV-resistant tomato hybrids",
                "Deploy yellow sticky traps to capture whitefly vectors"
            ]
        }
    },
    "Chickpea": {
        "Healthy": {
            "explanation": "The chickpea plant features healthy pinnate compound leaflets, vibrant light-green foliage, gland-covered stems, and zero symptoms of foliar blight or vascular wilting.",
            "symptoms": [
                "Uniform green small pinnate leaflets without circular lesions",
                "Clean stems and branches free of dark girdle spots or dry root rot",
                "Healthy flowering and pod set development"
            ],
            "recommended_actions": [
                "Maintain adequate soil moisture during flowering and pod development",
                "Apply balanced phosphorus and bio-fertilizer Rhizobium inoculants"
            ],
            "prevention": [
                "Plant high-germination, disease-resistant certified chickpea cultivars",
                "Practice 3-year crop rotation with non-leguminous crops like cereals"
            ]
        },
        "Ascochyta Blight": {
            "explanation": "Ascochyta Blight (Ascochyta rabiei) causes circular concentric lesions on leaves, pods, and stem girdling with dark pycnidia specks, leading to plant breakage.",
            "symptoms": [
                "Circular to oval lesions with brown margins and grayish centers on leaflets and pods",
                "Tiny black specks (pycnidia) arranged in concentric rings within lesions",
                "Stem lesions girdling branches and causing stem breakage (drooping shoots)"
            ],
            "recommended_actions": [
                "Avoid working in wet fields to prevent spore dispersal on clothes or tools",
                "Destroy infected crop residue post-harvest by deep plowing"
            ],
            "prevention": [
                "Sow Ascochyta blight-resistant chickpea varieties",
                "Use certified pathogen-free seeds treated with bio-inoculants or approved dressers"
            ]
        },
        "Fusarium Wilt": {
            "explanation": "Fusarium Wilt (Fusarium oxysporum f. sp. ciceris) is a soil-borne vascular fungal disease causing drooping of upper leaves, yellowing, vascular browning, and plant death.",
            "symptoms": [
                "Drooping of upper petioles and leaves (wilting) starting 3-4 weeks post-sowing",
                "Yellowing and drying of leaves progressing from bottom to top canopy",
                "Dark brown or black vascular discoloration inside split taproots"
            ],
            "recommended_actions": [
                "Uproot and burn wilted plants immediately to lower soil inocula",
                "Avoid water stagnation and improve soil organic matter"
            ],
            "prevention": [
                "Plant wilt-resistant chickpea cultivars",
                "Enforce a 3 to 5-year crop rotation with non-host crops like sorghum or wheat"
            ]
        },
        "Dry Root Rot": {
            "explanation": "Dry Root Rot (Rhizoctonia bataticola / Macrophomina phaseolina) occurs in hot, dry conditions causing sudden yellowing, stiff dry leaves, and brittle dark taproots.",
            "symptoms": [
                "Sudden drying and yellowing of leaves under high temperature stress",
                "Leaves remaining attached to dead, straw-colored upright stems",
                "Brittle, dark black taproot lacking lateral fine feeder roots"
            ],
            "recommended_actions": [
                "Provide protective irrigation during post-flowering dry spells",
                "Incorporate organic compost to enhance soil moisture retention"
            ],
            "prevention": [
                "Practice early sowing to avoid high ambient temperature stress at podding",
                "Sow dry root rot-tolerant chickpea lines"
            ]
        },
        "Stunt Virus": {
            "explanation": "Chickpea Stunt Virus (CpCSV / CCDV, vectored by aphids) causes severe plant stunting, leaf reddening or yellowing, shortened internodes, and phloem browning.",
            "symptoms": [
                "Severe stunting with bushy, bunched apical foliage growth",
                "Yellowing (desi varieties) or reddening (kabuli varieties) of leaf blade margins",
                "Dark brown discoloration of phloem tissues at the collar region"
            ],
            "recommended_actions": [
                "Rogue out stunt-infected plants early to curb secondary aphid spread",
                "Maintain weed-free field margins to eliminate vector host reservoirs"
            ],
            "prevention": [
                "Plant stunt-resistant chickpea cultivars",
                "Maintain optimal sowing density to discourage aphid landing"
            ]
        }
    }
}

# Default advisory fallback for unconfident predictions or expert verification flag
EXPERT_VERIFICATION_ADVISORY = {
    "explanation": "The leaf image features do not match known disease signatures with high statistical confidence. Expert field verification is recommended.",
    "symptoms": [
        "Atypical lesion geometry or chlorosis pattern",
        "Ambiguous visual symptoms overlapping multiple potential conditions"
    ],
    "recommended_actions": [
        "Consult a local agricultural extension expert or plant pathologist for field inspection",
        "Collect a physical sample or take additional high-resolution photos under clear daylight"
    ],
    "prevention": [
        "Isolate the affected field area and monitor surrounding plants for symptom progression"
    ]
}


def get_disease_advisory(crop_name: str, disease_name: str) -> Dict[str, Any]:
    """
    Retrieves controlled advisory data for a given crop and disease.
    Returns EXPERT_VERIFICATION_ADVISORY if disease is unverified or unknown.
    """
    crop_data = ADVISORY_DATABASE.get(crop_name, {})
    advisory = crop_data.get(disease_name)

    if not advisory or disease_name == "Needs expert verification":
        return EXPERT_VERIFICATION_ADVISORY

    return advisory
