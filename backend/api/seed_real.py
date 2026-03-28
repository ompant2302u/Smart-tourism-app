# Seed script - called from management command (Django already set up)
# Uses curated permanent Unsplash photo URLs - no API key, no redirects needed
from api.models import Category, Destination, Hotel, Guide, SafetyAlert, EmergencyContact

print("Clearing old data...")
Category.objects.all().delete()
Destination.objects.all().delete()
Hotel.objects.all().delete()
Guide.objects.all().delete()
SafetyAlert.objects.all().delete()
EmergencyContact.objects.all().delete()
print("Old data cleared.")

# ------------------------------------------------------------
cats = {}
for name, slug, icon in [
    ("Trekking","trekking","🥾"), ("Cultural","cultural","🏛️"), ("Wildlife","wildlife","🐘"),
    ("City","city","🏙️"), ("Adventure","adventure","🏔️"), ("Spiritual","spiritual","🕉️"),
    ("Scenic","scenic","🌄"),
]:
    cats[slug] = Category.objects.create(name=name, slug=slug, icon=icon)
print("Categories created.")

# ------------------------------------------------------------
# All images: curated permanent Unsplash URLs (tested, high quality, Nepal/Himalaya themed)
DEST_DATA = [
    dict(id=1, name="Everest Base Camp", slug="everest-base-camp", city="Solukhumbu", cat="trekking",
         rating=4.9, fee=0, best="Mar-May, Sep-Nov", alt="5,364m", diff="Strenuous",
         lat=28.0026, lon=86.8528,
         short="The world's most iconic trek to the foot of Mt. Everest at 5,364m - a life-defining Himalayan adventure.",
         desc="Everest Base Camp is the ultimate bucket-list trek. Over 12-14 days you walk through the legendary Khumbu Valley, passing through Namche Bazaar, Tengboche Monastery, and Gorak Shep before reaching the foot of the world's highest peak at 5,364m. The trail winds through ancient Sherpa villages, rhododendron forests, glacial moraines, and high-altitude passes. The views of Everest, Lhotse, Nuptse, and the Khumbu Icefall are simply breathtaking. This is not just a trek - it is a journey into the heart of the Himalayas.",
         image="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=85"),
    dict(id=2, name="Pokhara Lakeside", slug="pokhara-lakeside", city="Pokhara", cat="city",
         rating=4.8, fee=0, best="Sep-Nov, Feb-Apr", alt="827m", diff="Easy",
         lat=28.2096, lon=83.9856,
         short="Nepal's adventure capital - Phewa Lake reflections, Annapurna panoramas, and world-class paragliding.",
         desc="Pokhara is Nepal's most beautiful city, sitting at 827m beside the mirror-like Phewa Lake with the entire Annapurna range - including the iconic fishtail peak Machhapuchhre - dominating the skyline. The city is the gateway to the Annapurna Circuit and Sanctuary treks. By day, paraglide over the lake, kayak on its glassy surface, or visit the stunning Davis Falls and Gupteshwor Cave. By night, the lakeside promenade buzzes with restaurants, cafes, and live music. The sunrise view of Annapurna from Sarangkot is one of Nepal's most photographed moments.",
         image="https://images.unsplash.com/photo-1544735716-392fe2489ffa?w=1200&q=85"),
    dict(id=3, name="Chitwan National Park", slug="chitwan-national-park", city="Chitwan", cat="wildlife",
         rating=4.7, fee=25, best="Oct-Mar", alt="100m", diff="Easy",
         lat=27.5291, lon=84.3542,
         short="UNESCO World Heritage jungle - one-horned rhinos, Bengal tigers, and elephant safaris in the Terai lowlands.",
         desc="Chitwan National Park is Nepal's crown jewel of wildlife conservation and a UNESCO World Heritage Site. Spread across 952 sq km of dense sal forest, grasslands, and river floodplains, the park shelters one of Asia's last populations of one-horned rhinoceros, Bengal tigers, gharial crocodiles, and wild elephants. Jeep safaris at dawn reveal rhinos grazing in the mist, while canoe rides on the Rapti River bring you face-to-face with mugger crocodiles. The park also hosts over 500 bird species, making it a paradise for birdwatchers. The nearby Tharu villages offer authentic cultural experiences.",
         image="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=85"),
    dict(id=4, name="Pashupatinath Temple", slug="pashupatinath-temple", city="Kathmandu", cat="spiritual",
         rating=4.6, fee=10, best="Year Round", alt="1,300m", diff="Easy",
         lat=27.7105, lon=85.3487,
         short="Nepal's holiest Hindu temple - a UNESCO World Heritage Site on the sacred Bagmati River.",
         desc="Pashupatinath Temple is one of the most sacred Hindu temples in the world, dedicated to Lord Shiva as the 'Lord of Animals'. This UNESCO World Heritage Site on the banks of the holy Bagmati River is a sprawling complex of over 500 temples, ashrams, images, and inscriptions. The main pagoda-style temple dates to the 5th century AD. Sadhus (holy men) covered in ash and saffron robes meditate along the ghats, while the evening aarti ceremony - with fire, incense, and chanting - is deeply moving. The cremation ghats on the river are a profound reminder of life's impermanence.",
         image="https://images.unsplash.com/photo-1580674684081-7617fbf3d745?w=1200&q=85"),
    dict(id=5, name="Annapurna Circuit", slug="annapurna-circuit", city="Manang", cat="trekking",
         rating=4.8, fee=0, best="Oct-Nov, Mar-May", alt="5,416m", diff="Challenging",
         lat=28.7041, lon=84.1229,
         short="The classic 14-21 day circuit circumnavigating the Annapurna massif over the 5,416m Thorong La Pass.",
         desc="The Annapurna Circuit is widely regarded as one of the world's greatest treks. The 14-21 day journey circumnavigates the entire Annapurna massif, crossing the dramatic 5,416m Thorong La Pass - one of the highest trekking passes on earth. The route passes through an extraordinary diversity of landscapes: subtropical rice paddies, oak and rhododendron forests, high-altitude deserts, and glaciated peaks. Cultural highlights include the sacred Muktinath Temple, the medieval walled city of Manang, and traditional Gurung and Thakali villages. The views of Annapurna I (8,091m), Dhaulagiri (8,167m), and Machhapuchhre are unforgettable.",
         image="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=85"),
    dict(id=6, name="Boudhanath Stupa", slug="boudhanath-stupa", city="Kathmandu", cat="cultural",
         rating=4.7, fee=5, best="Year Round", alt="1,400m", diff="Easy",
         lat=27.7215, lon=85.3620,
         short="One of the world's largest Buddhist stupas - the spiritual heart of Tibetan Buddhism in Nepal.",
         desc="Boudhanath Stupa is one of the largest and most magnificent Buddhist stupas in the world, and the spiritual center of Tibetan Buddhism in Nepal. The massive mandala-shaped structure, with its all-seeing eyes of Buddha gazing in four directions, is surrounded by a ring of 147 niches containing prayer wheels and Buddha images. The kora (circumambulation) at dawn - with monks in saffron robes, pilgrims spinning prayer wheels, and the smell of juniper incense - is one of the most atmospheric experiences in Asia. The surrounding neighborhood is filled with Tibetan monasteries, thangka painting shops, and excellent cafes.",
         image="https://images.unsplash.com/photo-1605640840605-14ac1855827b?w=1200&q=85"),
    dict(id=7, name="Nagarkot Sunrise Viewpoint", slug="nagarkot-sunrise", city="Bhaktapur", cat="scenic",
         rating=4.5, fee=0, best="Oct-Apr", alt="2,195m", diff="Easy",
         lat=27.7167, lon=85.5167,
         short="The closest Himalayan sunrise viewpoint to Kathmandu - panoramic views of eight of the world's highest peaks.",
         desc="Nagarkot, perched at 2,195m on the rim of the Kathmandu Valley, offers what many consider the finest Himalayan panorama accessible from the capital. On clear mornings, you can see a 200km arc of snow-capped peaks including Everest (8,849m), Lhotse, Makalu, Cho Oyu, Manaslu, Ganesh Himal, Langtang, and the iconic Machhapuchhre. The pre-dawn hike to the viewpoint tower, followed by the golden sunrise painting the peaks in shades of pink and orange, is a magical experience. The village itself is charming, with terraced fields, traditional farmhouses, and excellent hiking trails.",
         image="https://images.unsplash.com/photo-1571401835393-8c5f35328320?w=1200&q=85"),
    dict(id=8, name="Lumbini - Birthplace of Buddha", slug="lumbini", city="Rupandehi", cat="spiritual",
         rating=4.6, fee=3, best="Oct-Mar", alt="100m", diff="Easy",
         lat=27.4833, lon=83.2767,
         short="The sacred birthplace of Siddhartha Gautama - a UNESCO World Heritage Site and one of Buddhism's holiest pilgrimage sites.",
         desc="Lumbini is one of the four holiest sites in Buddhism, where Queen Mayadevi gave birth to Siddhartha Gautama - the future Buddha - in 623 BC. This UNESCO World Heritage Site in the Terai lowlands contains the sacred Maya Devi Temple (built over the exact birthplace), the Ashoka Pillar erected by Emperor Ashoka in 249 BC, and the sacred Puskarini Pond where the Buddha's mother bathed. The surrounding Lumbini Development Zone contains over 40 monasteries built by Buddhist nations from around the world, creating a remarkable international Buddhist village. The atmosphere of peace and contemplation is profound.",
         image="https://images.unsplash.com/photo-1609766857041-ed402ea8069a?w=1200&q=85"),
    dict(id=9, name="Rara Lake", slug="rara-lake", city="Mugu", cat="scenic",
         rating=4.9, fee=5, best="Apr-Jun, Sep-Nov", alt="2,990m", diff="Challenging",
         lat=29.5167, lon=82.0833,
         short="Nepal's largest and most pristine alpine lake - a sapphire jewel hidden in the remote Karnali wilderness.",
         desc="Rara Lake is Nepal's best-kept secret and arguably its most beautiful natural wonder. Sitting at 2,990m in the remote Karnali region of far-western Nepal, this 10.8 sq km lake shimmers in impossible shades of sapphire, turquoise, and emerald depending on the light and season. The lake is surrounded by dense pine and juniper forests, snow-capped peaks, and the pristine Rara National Park - home to red pandas, Himalayan black bears, and over 200 bird species. Very few tourists make the journey here, making it one of the last truly wild places in Nepal. The silence is extraordinary.",
         image="https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1200&q=85"),
    dict(id=10, name="Patan Durbar Square", slug="patan-durbar-square", city="Lalitpur", cat="cultural",
         rating=4.7, fee=10, best="Year Round", alt="1,337m", diff="Easy",
         lat=27.6762, lon=85.3172,
         short="The finest example of Newari architecture in Nepal - a UNESCO World Heritage palace square of extraordinary beauty.",
         desc="Patan's Durbar Square is widely considered the finest example of Newari craftsmanship and architecture in Nepal. The square is a masterpiece of medieval urban planning, packed with ancient temples, the magnificent Royal Palace complex, and intricate stone, wood, and metal carvings. The Krishna Mandir - built entirely of stone in 1637 - is a particular highlight, with 21 spires and friezes depicting scenes from the Mahabharata and Ramayana. The Patan Museum inside the palace is one of the finest museums in Asia. The surrounding streets are filled with traditional metalworkers, thangka painters, and excellent restaurants.",
         image="https://images.unsplash.com/photo-1605640840605-14ac1855827b?w=1200&q=85"),
    dict(id=11, name="Langtang Valley", slug="langtang-valley", city="Rasuwa", cat="trekking",
         rating=4.7, fee=0, best="Mar-May, Sep-Nov", alt="3,430m", diff="Moderate",
         lat=28.2167, lon=85.5167,
         short="The 'Valley of Glaciers' - a stunning 7-10 day trek just 3 hours from Kathmandu through Tamang villages.",
         desc="Langtang Valley is Nepal's closest major trekking destination to Kathmandu, yet it feels worlds away from the city. The 7-10 day trek follows the Langtang River through dense forests of oak, maple, and rhododendron before emerging into a high-altitude valley flanked by the massive Langtang Lirung (7,227m) and Ganesh Himal. The trail passes through traditional Tamang villages where yak herding and cheese-making are still practiced as they have been for centuries. The Kyanjin Gompa monastery at 3,870m is a spiritual highlight, and the climb to Tserko Ri (4,984m) offers one of the finest panoramas in Nepal.",
         image="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=85"),
    dict(id=12, name="Ghorepani Poon Hill", slug="poon-hill", city="Myagdi", cat="trekking",
         rating=4.8, fee=0, best="Oct-Apr", alt="3,210m", diff="Moderate",
         lat=28.4000, lon=83.7000,
         short="Nepal's most popular short trek - the golden sunrise over Dhaulagiri and Annapurna from Poon Hill is legendary.",
         desc="The Ghorepani Poon Hill trek is Nepal's most celebrated short trek, and for good reason. The 4-5 day circuit through the Annapurna foothills rewards trekkers with what many consider the finest panoramic Himalayan sunrise in the world. From Poon Hill at 3,210m, the view encompasses Dhaulagiri (8,167m), Annapurna South, Hiunchuli, Machhapuchhre, and dozens of other peaks - all bathed in the golden light of dawn. The trail passes through dense rhododendron forests (spectacular in March-April when in full bloom), traditional Gurung and Magar villages, and the charming village of Ghorepani.",
         image="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=85"),
    dict(id=13, name="Bhaktapur Durbar Square", slug="bhaktapur-durbar-square", city="Bhaktapur", cat="cultural",
         rating=4.7, fee=15, best="Year Round", alt="1,401m", diff="Easy",
         lat=27.6722, lon=85.4278,
         short="The best-preserved medieval city in Nepal - a living UNESCO World Heritage museum of Newari art and culture.",
         desc="Bhaktapur - the 'City of Devotees' - is the most intact medieval city in Nepal and one of the finest examples of traditional Newari urban culture in the world. The UNESCO World Heritage city's Durbar Square is dominated by the magnificent 55-Window Palace, the Golden Gate (considered the finest piece of art in Nepal), and the Nyatapola Temple - the tallest pagoda in Nepal at 30m. The city's narrow cobblestone streets are lined with traditional pottery workshops, weaving studios, and thangka painting schools. The famous Bhaktapur curd (juju dhau) and bara snacks are not to be missed.",
         image="https://images.unsplash.com/photo-1605640840605-14ac1855827b?w=1200&q=85"),
    dict(id=14, name="Upper Mustang", slug="upper-mustang", city="Mustang", cat="cultural",
         rating=4.8, fee=500, best="Mar-Nov", alt="3,840m", diff="Moderate",
         lat=29.1833, lon=83.9667,
         short="The forbidden kingdom - ancient cave monasteries, the walled city of Lo Manthang, and a Tibetan plateau frozen in time.",
         desc="Upper Mustang was one of the last forbidden kingdoms on earth, closed to outsiders until 1992. This remote region on the Tibetan plateau feels like stepping back 500 years. The walled medieval city of Lo Manthang - with its whitewashed buildings, ancient monasteries, and the palace of the King of Mustang - is unlike anywhere else in Nepal. The landscape is stark and otherworldly: eroded red and ochre cliffs, ancient cave monasteries carved into cliff faces, and the vast Tibetan plateau stretching to the horizon. The $500 restricted area permit keeps crowds away, preserving the region's extraordinary authenticity.",
         image="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=85"),
    dict(id=15, name="Bardia National Park", slug="bardia-national-park", city="Bardiya", cat="wildlife",
         rating=4.7, fee=20, best="Oct-Apr", alt="150m", diff="Easy",
         lat=28.3667, lon=81.5000,
         short="Nepal's largest and wildest national park - more tiger sightings than Chitwan, with almost no crowds.",
         desc="Bardia National Park in far-western Nepal is the country's largest and most pristine national park, covering 968 sq km of dense sal forest, grasslands, and river floodplains along the Karnali River. With far fewer tourists than Chitwan, wildlife encounters here feel genuinely wild and authentic. The park has the highest density of Bengal tigers in Nepal, and sightings are more frequent than almost anywhere else in Asia. Other wildlife includes one-horned rhinos, wild elephants, gharial crocodiles, Gangetic dolphins, and over 400 bird species. The Tharu cultural village experiences are among the most authentic in Nepal.",
         image="https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=85"),
]

dests = {}
for d in DEST_DATA:
    obj = Destination.objects.create(
        id=d["id"], name=d["name"], slug=d["slug"], city=d["city"], country="Nepal",
        category=cats[d["cat"]], rating=d["rating"], entry_fee=d["fee"], currency="USD",
        best_time_to_visit=d["best"], short_description=d["short"], description=d["desc"],
        latitude=d["lat"], longitude=d["lon"], image=d["image"],
        altitude=d["alt"], difficulty=d["diff"],
    )
    dests[d["id"]] = obj
    print(f"  Destination: {d['name']}")

print(f"\n{len(dests)} destinations created")

# ------------------------------------------------------------
HOTEL_DATA = [
    dict(name="Hyatt Regency Kathmandu", slug="hyatt-regency-kathmandu", dest_id=4,
         desc="Set in 37 acres of beautifully landscaped gardens near Boudhanath Stupa, the Hyatt Regency Kathmandu is the city's premier luxury resort. The hotel features three restaurants including the award-winning Rox Restaurant, a stunning outdoor pool surrounded by tropical gardens, a world-class spa, and a fitness center. Rooms offer mountain or garden views, and the service is impeccable. The location near Boudhanath makes it ideal for exploring the spiritual heart of Kathmandu.",
         rating=4.8, stars=5, price=280, wifi=True, pool=True, gym=True, rest=True, park=True, spa=True,
         addr="Taragaon, Boudha, Kathmandu 44600", phone="+977-1-4491234", email="kathmandu.regency@hyatt.com",
         lat=27.7215, lon=85.3620,
         image="https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1200&q=85"),
    dict(name="Dwarika's Hotel", slug="dwarikas-hotel", dest_id=4,
         desc="Dwarika's Hotel is one of Asia's most extraordinary boutique hotels - a living museum of Newari art and architecture. The hotel was built over decades by the late Dwarika Das Shrestha, who rescued 500-year-old carved wooden windows, doorways, and struts from demolition across Kathmandu Valley and incorporated them into the hotel's architecture. Winner of multiple UNESCO Asia-Pacific Heritage Awards, Dwarika's offers an unparalleled immersion in Nepal's artistic heritage. The Krishnarpan restaurant serves a legendary 22-course Nepali feast.",
         rating=4.9, stars=5, price=350, wifi=True, pool=True, gym=True, rest=True, park=True, spa=True,
         addr="Battisputali, Kathmandu 44600", phone="+977-1-4479488", email="reservations@dwarikas.com",
         lat=27.7100, lon=85.3400,
         image="https://images.unsplash.com/photo-1582719508461-905c673771fd?w=1200&q=85"),
    dict(name="Hotel Yak & Yeti", slug="hotel-yak-yeti", dest_id=4,
         desc="The Hotel Yak & Yeti is one of Kathmandu's most iconic landmarks, housed in a historic Rana palace dating to the 19th century. The hotel combines heritage architecture with modern luxury, featuring a large outdoor pool, multiple restaurants including the legendary Chimney Restaurant, and a prime location on Durbar Marg - Kathmandu's most prestigious boulevard. The hotel has hosted royalty, heads of state, and legendary mountaineers including Sir Edmund Hillary.",
         rating=4.7, stars=5, price=220, wifi=True, pool=True, gym=True, rest=True, park=True, spa=True,
         addr="Durbar Marg, Kathmandu 44600", phone="+977-1-4248999", email="info@yakandyeti.com",
         lat=27.7172, lon=85.3240,
         image="https://images.unsplash.com/photo-1455587734955-081b22074882?w=1200&q=85"),
    dict(name="Thamel Eco Resort", slug="thamel-eco-resort", dest_id=4,
         desc="A charming eco-friendly boutique hotel in the heart of Thamel - Kathmandu's vibrant traveler district. The resort features a beautiful rooftop garden with mountain views, an organic farm-to-table restaurant, solar-powered hot water, and thoughtfully designed rooms with traditional Nepali decor. The location puts you within walking distance of Thamel's best restaurants, shops, and the historic Durbar Square. Perfect for travelers who want comfort with a conscience.",
         rating=4.4, stars=3, price=75, wifi=True, pool=False, gym=False, rest=True, park=False, spa=False,
         addr="Thamel, Kathmandu 44600", phone="+977-1-4700890", email="info@thamelecoresort.com",
         lat=27.7172, lon=85.3100,
         image="https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&q=85"),
    dict(name="Temple Tree Resort & Spa", slug="temple-tree-resort", dest_id=2,
         desc="Temple Tree Resort & Spa is Pokhara's finest boutique resort, set on the shores of Phewa Lake with breathtaking views of the Annapurna range. The resort's infinity pool appears to merge with the lake, creating a stunning visual effect. The award-winning Pokhara Grande Spa offers traditional Ayurvedic treatments, and the restaurant serves exceptional Nepali and international cuisine. Each villa is individually designed with local materials and artwork. The sunrise view of Machhapuchhre from the pool deck is simply unforgettable.",
         rating=4.7, stars=4, price=145, wifi=True, pool=True, gym=False, rest=True, park=True, spa=True,
         addr="Lakeside, Pokhara 33700", phone="+977-61-465888", email="info@templetree.com.np",
         lat=28.2096, lon=83.9556,
         image="https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=1200&q=85"),
    dict(name="Fish Tail Lodge", slug="fish-tail-lodge", dest_id=2,
         desc="Fish Tail Lodge is one of Nepal's most unique and romantic hotels - a private island lodge on Phewa Lake accessible only by a hand-pulled raft. The lodge is named after the iconic Machhapuchhre (Fishtail) peak that towers above it. Traditional Nepali architecture, lush gardens, and the sound of the lake create an atmosphere of complete serenity. The restaurant serves excellent Nepali and continental cuisine, and the spa offers traditional treatments. Watching the Annapurna range reflected in the lake at sunset from your private terrace is pure magic.",
         rating=4.8, stars=4, price=180, wifi=True, pool=False, gym=False, rest=True, park=False, spa=True,
         addr="Phewa Lake, Pokhara 33700", phone="+977-61-465071", email="info@fishtaillodge.com.np",
         lat=28.2050, lon=83.9500,
         image="https://images.unsplash.com/photo-1510798831971-661eb04b3739?w=1200&q=85"),
    dict(name="Pokhara Grande", slug="pokhara-grande", dest_id=2,
         desc="Pokhara Grande is the city's most modern luxury hotel, featuring a spectacular rooftop infinity pool with panoramic views of the Annapurna range and Phewa Lake. The hotel's contemporary design incorporates traditional Nepali motifs throughout. The Annapurna Terrace restaurant offers the finest dining in Pokhara, with a menu showcasing the best of Nepali and international cuisine. The spa, fitness center, and business facilities make it ideal for both leisure and corporate travelers.",
         rating=4.6, stars=5, price=195, wifi=True, pool=True, gym=True, rest=True, park=True, spa=True,
         addr="Chipledhunga, Pokhara 33700", phone="+977-61-530000", email="info@pokharagrande.com",
         lat=28.2300, lon=83.9900,
         image="https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=1200&q=85"),
    dict(name="Barahi Jungle Lodge", slug="barahi-jungle-lodge", dest_id=3,
         desc="Barahi Jungle Lodge is an award-winning eco-lodge set in the buffer zone of Chitwan National Park, offering an authentic jungle experience without sacrificing comfort. The lodge's thatched-roof cottages are built in traditional Tharu style, surrounded by lush gardens and the sounds of the jungle. Activities include jeep safaris, elephant-back safaris, canoe rides on the Rapti River, and guided nature walks. The lodge's naturalists are among the best in Nepal, with an extraordinary ability to spot wildlife. The open-air restaurant serves excellent Nepali and continental cuisine.",
         rating=4.6, stars=4, price=120, wifi=True, pool=False, gym=False, rest=True, park=False, spa=False,
         addr="Sauraha, Chitwan 44200", phone="+977-56-580001", email="info@barahijunglelodge.com",
         lat=27.5333, lon=84.3667,
         image="https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=1200&q=85"),
    dict(name="Meghauli Serai - A Taj Safari", slug="meghauli-serai", dest_id=3,
         desc="Meghauli Serai is Nepal's most luxurious safari lodge, operated by the legendary Taj Hotels group. Set on the banks of the Rapti River inside Chitwan National Park, the lodge offers an unparalleled wildlife experience combined with world-class hospitality. The 29 tented suites and villas are elegantly furnished with local materials and open onto private decks overlooking the river and jungle. Expert naturalists lead exclusive wildlife safaris, and the probability of tiger sightings is among the highest in Asia. The infinity pool overlooking the river is extraordinary.",
         rating=4.9, stars=5, price=450, wifi=True, pool=True, gym=False, rest=True, park=False, spa=True,
         addr="Meghauli, Chitwan 44200", phone="+977-56-580100", email="meghauli.serai@tajhotels.com",
         lat=27.5700, lon=84.2300,
         image="https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&q=85"),
    dict(name="Everest View Hotel", slug="everest-view-hotel", dest_id=1,
         desc="The Everest View Hotel holds the Guinness World Record as the world's highest-altitude hotel, perched at 3,880m above sea level at Syangboche above Namche Bazaar. The hotel offers direct, unobstructed views of Everest, Lhotse, Ama Dablam, and the entire Khumbu range from its panoramic windows and terrace. Originally built in 1971 for Japanese tourists flown in by helicopter, the hotel has been lovingly restored and offers comfortable rooms, a cozy bar, and hearty meals. Waking up to Everest at sunrise from your bed is an experience unlike any other.",
         rating=4.5, stars=3, price=95, wifi=True, pool=False, gym=False, rest=True, park=False, spa=False,
         addr="Syangboche, Solukhumbu 56001", phone="+977-38-540000", email="info@everestviewhotel.com",
         lat=27.8100, lon=86.7200,
         image="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=85"),
    dict(name="Sanctuary Lodge Annapurna", slug="sanctuary-lodge-annapurna", dest_id=5,
         desc="Sanctuary Lodge is the only luxury lodge at the entrance to the Annapurna Sanctuary, one of the most dramatic mountain amphitheaters on earth. The lodge sits at 2,040m in Chomrong village, with stunning views of Machhapuchhre (6,993m) and Annapurna South (7,219m). Stone-built rooms with private balconies, a cozy fireplace lounge, and a spa offering traditional Nepali treatments make this the perfect base for exploring the Annapurna region. The lodge's guides are among the most knowledgeable in Nepal.",
         rating=4.7, stars=4, price=160, wifi=True, pool=False, gym=False, rest=True, park=False, spa=True,
         addr="Chomrong, Kaski 33700", phone="+977-61-465000", email="info@sanctuarylodge.com",
         lat=28.4200, lon=83.8200,
         image="https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1200&q=85"),
    dict(name="Lumbini Buddha Hotel", slug="lumbini-buddha-hotel", dest_id=8,
         desc="The Lumbini Buddha Hotel is a peaceful sanctuary near the sacred Lumbini garden, designed in harmony with the spiritual atmosphere of the Buddha's birthplace. The hotel features traditional Buddhist architecture, a meditation garden, and rooms that open onto serene courtyards. The restaurant serves vegetarian and non-vegetarian Nepali and international cuisine. The hotel's location makes it the ideal base for exploring the Maya Devi Temple, the Ashoka Pillar, and the international monastery zone. The silence and tranquility here are extraordinary.",
         rating=4.3, stars=3, price=55, wifi=True, pool=False, gym=False, rest=True, park=True, spa=False,
         addr="Lumbini Development Zone, Rupandehi 32900", phone="+977-71-580100", email="info@lumbinibuddhahotel.com",
         lat=27.4833, lon=83.2767,
         image="https://images.unsplash.com/photo-1609766857041-ed402ea8069a?w=1200&q=85"),
    dict(name="Inn Patan", slug="inn-patan", dest_id=10,
         desc="Inn Patan is a beautifully restored Newari townhouse in the heart of Patan's historic district, just steps from the UNESCO World Heritage Durbar Square. The hotel's traditional architecture - with carved wooden windows, brick courtyards, and terracotta tiles - creates an authentic atmosphere that larger hotels cannot replicate. The rooftop restaurant offers views over the ancient city's pagoda rooftops. Each room is individually decorated with traditional Nepali textiles and artwork. The location is perfect for exploring Patan's temples, metalwork studios, and the excellent Patan Museum.",
         rating=4.5, stars=3, price=80, wifi=True, pool=False, gym=False, rest=True, park=False, spa=False,
         addr="Mangal Bazar, Patan 44700", phone="+977-1-5522388", email="info@innpatan.com",
         lat=27.6762, lon=85.3172,
         image="https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=1200&q=85"),
    dict(name="Bhaktapur Heritage Hotel", slug="bhaktapur-heritage-hotel", dest_id=13,
         desc="The Bhaktapur Heritage Hotel is a lovingly restored traditional Newari building inside the UNESCO World Heritage city of Bhaktapur. The hotel's rooftop terrace offers spectacular views over the ancient Durbar Square and the Nyatapola Temple. Rooms feature traditional Newari woodcarvings, handwoven textiles, and modern amenities. The restaurant serves authentic Bhaktapur cuisine including the famous juju dhau (king curd) and bara. The hotel is the perfect base for exploring Bhaktapur's extraordinary medieval architecture, pottery squares, and weaving workshops.",
         rating=4.4, stars=3, price=70, wifi=True, pool=False, gym=False, rest=True, park=False, spa=False,
         addr="Durbar Square, Bhaktapur 44800", phone="+977-1-6610488", email="info@bhaktapurheritage.com",
         lat=27.6722, lon=85.4278,
         image="https://images.unsplash.com/photo-1605640840605-14ac1855827b?w=1200&q=85"),
]

for h in HOTEL_DATA:
    Hotel.objects.create(
        name=h["name"], slug=h["slug"], destination=dests[h["dest_id"]],
        description=h["desc"], rating=h["rating"], stars=h["stars"], price_per_night=h["price"],
        has_wifi=h["wifi"], has_pool=h["pool"], has_gym=h["gym"],
        has_restaurant=h["rest"], has_parking=h["park"], has_spa=h["spa"],
        address=h["addr"], phone=h["phone"], email=h["email"],
        latitude=h["lat"], longitude=h["lon"], image=h["image"],
    )
    print(f"  Hotel: {h['name']}")

print(f"\n{Hotel.objects.count()} hotels created")

# ------------------------------------------------------------
GUIDE_DATA = [
    dict(name="Pemba Sherpa", slug="pemba-sherpa", rating=4.9, exp=15, price=80, cert=True,
         spec="High altitude trekking, Everest region, mountaineering, acclimatization management",
         langs="English, Nepali, Tibetan, Hindi",
         bio="Pemba Sherpa is one of Nepal's most celebrated mountain guides, born in the Khumbu Valley in the shadow of Everest. With 15 years of guiding experience, he has summited Everest three times and guided over 200 trekkers safely to Base Camp. Pemba holds a certified mountain guide license from the Nepal Mountaineering Association and a wilderness first aid certification. His deep knowledge of Sherpa culture, Buddhist traditions, and high-altitude medicine makes every trek with him an education as well as an adventure. He speaks with quiet authority and genuine warmth.",
         phone="+977-9841234567", email="pemba@himalayaguides.com",
         image="https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=600&q=85",
         dest_ids=[1, 5]),
    dict(name="Sita Gurung", slug="sita-gurung", rating=4.8, exp=10, price=65, cert=True,
         spec="Cultural heritage tours, temple visits, Kathmandu Valley history, food and cuisine tours",
         langs="English, Nepali, French, German",
         bio="Sita Gurung is one of Nepal's finest cultural guides and a passionate advocate for Newari heritage. Born in Patan, she grew up surrounded by the ancient temples and courtyards that she now brings to life for visitors from around the world. Sita holds a degree in History and Archaeology from Tribhuvan University and has been guiding for 10 years. She is fluent in four languages and has a gift for making complex history accessible and engaging. Her food tours of Kathmandu's hidden eateries are legendary among travelers.",
         phone="+977-9851234567", email="sita@culturalnepal.com",
         image="https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=600&q=85",
         dest_ids=[4, 6, 10, 13]),
    dict(name="Bikram Rai", slug="bikram-rai", rating=4.7, exp=8, price=60, cert=True,
         spec="Annapurna trekking, bird watching, nature photography, Pokhara adventure tours",
         langs="English, Nepali, Spanish",
         bio="Bikram Rai is an expert trekking guide for the Annapurna region with 8 years of experience leading treks from the classic Poon Hill circuit to the full Annapurna Circuit. He is also a certified bird watching guide with an encyclopedic knowledge of over 400 Himalayan bird species. Bikram's passion for nature photography means he always knows the best spots and times for capturing the perfect shot. His calm, encouraging style makes him particularly popular with first-time trekkers.",
         phone="+977-9861234567", email="bikram@annapurnaguides.com",
         image="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&q=85",
         dest_ids=[2, 5, 12]),
    dict(name="Maya Thapa", slug="maya-thapa", rating=4.6, exp=6, price=55, cert=True,
         spec="Wildlife safaris, jeep tours, elephant activities, bird watching, Tharu culture",
         langs="English, Nepali, Hindi",
         bio="Maya Thapa is Chitwan's most knowledgeable and passionate wildlife guide. Born in a Tharu village on the edge of the national park, she grew up with an intimate understanding of the jungle and its inhabitants. With 6 years of professional guiding experience, Maya has an extraordinary ability to track tigers, rhinos, and other wildlife. She is also a cultural ambassador for the Tharu people, offering authentic insights into their traditions, festivals, and relationship with the natural world.",
         phone="+977-9871234567", email="maya@chitwanguides.com",
         image="https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=600&q=85",
         dest_ids=[3, 15]),
    dict(name="Dawa Lama", slug="dawa-lama", rating=4.8, exp=12, price=75, cert=True,
         spec="Buddhist pilgrimage tours, meditation retreats, Tibetan culture, monastery visits",
         langs="English, Nepali, Tibetan, Chinese",
         bio="Dawa Lama spent 8 years as a Buddhist monk before becoming a guide, and his spiritual depth transforms every tour into a profound journey. With 12 years of guiding experience, Dawa leads pilgrimage tours to Nepal's most sacred Buddhist and Hindu sites, offering insights that no guidebook can provide. His meditation retreats at Boudhanath and Swayambhunath are transformative experiences. Dawa is fluent in Tibetan and Chinese, making him particularly valuable for visitors from Tibet and China.",
         phone="+977-9881234567", email="dawa@spiritualnepal.com",
         image="https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=600&q=85",
         dest_ids=[6, 8, 4]),
    dict(name="Hari Bahadur Magar", slug="hari-magar", rating=4.7, exp=9, price=65, cert=True,
         spec="Langtang trekking, Tamang heritage trail, off-beat routes, community tourism",
         langs="English, Nepali, Tamang",
         bio="Hari Bahadur Magar was born in a Tamang village in the Langtang Valley and has been guiding treks in the region for 9 years. His intimate knowledge of the local culture, flora, and fauna is unmatched. Hari is a passionate advocate for community-based tourism and ensures that his tours benefit local families directly. He speaks the Tamang language fluently and can arrange authentic homestay experiences that are unavailable through any other guide.",
         phone="+977-9891234567", email="hari@langtangguides.com",
         image="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&q=85",
         dest_ids=[11, 5]),
    dict(name="Sunita Shrestha", slug="sunita-shrestha", rating=4.5, exp=5, price=50, cert=True,
         spec="City tours, shopping guides, food tours, Newari culture, day trips from Kathmandu",
         langs="English, Nepali, Japanese",
         bio="Sunita Shrestha is a young, energetic, and highly knowledgeable guide specializing in Kathmandu Valley cultural tours. Fluent in Japanese, she has guided hundreds of Japanese visitors through Nepal's extraordinary heritage. Sunita's food tours - visiting hidden local eateries, spice markets, and traditional sweet shops - are among the most popular experiences in Kathmandu. Her enthusiasm for her city is infectious, and her insider knowledge of the best shops, restaurants, and hidden gems is invaluable.",
         phone="+977-9801234567", email="sunita@kathmanduguides.com",
         image="https://images.unsplash.com/photo-1607746882042-944635dfe10e?w=600&q=85",
         dest_ids=[4, 6, 10]),
    dict(name="Rajan Tamang", slug="rajan-tamang", rating=4.6, exp=7, price=58, cert=True,
         spec="Upper Mustang exploration, horse trekking, Tibetan plateau culture, restricted area permits",
         langs="English, Nepali, Tibetan",
         bio="Rajan Tamang is one of the very few guides licensed to lead treks in the restricted Upper Mustang region. His family has lived in the Lo Manthang area for generations, giving him an unparalleled understanding of the region's history, culture, and landscape. Rajan handles all restricted area permit arrangements and has established relationships with local families who offer authentic homestay experiences. His knowledge of the ancient cave monasteries and the history of the Kingdom of Lo is extraordinary.",
         phone="+977-9811234567", email="rajan@mustangguides.com",
         image="https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&q=85",
         dest_ids=[14]),
]

for g in GUIDE_DATA:
    guide_obj = Guide.objects.create(
        name=g["name"], slug=g["slug"], rating=g["rating"],
        years_experience=g["exp"], price_per_day=g["price"],
        specialties=g["spec"], languages=g["langs"], is_certified=g["cert"],
        bio=g["bio"], phone=g["phone"], email=g["email"], image=g["image"],
    )
    guide_obj.destinations.set([dests[i] for i in g["dest_ids"] if i in dests])
    print(f"  Guide: {g['name']}")

print(f"\n{Guide.objects.count()} guides created")

# ------------------------------------------------------------
SafetyAlert.objects.bulk_create([
    SafetyAlert(title="Altitude Sickness Warning", level="high",
        description="Trekkers above 3,500m must acclimatize properly. Acute Mountain Sickness (AMS) symptoms include severe headache, nausea, vomiting, and fatigue. If symptoms worsen, descend immediately. Never ascend with AMS symptoms. Carry Diamox if prescribed by your doctor.",
        destination=dests[1]),
    SafetyAlert(title="Monsoon Season Trail Closures", level="medium",
        description="Heavy monsoon rainfall from June to September may cause trail closures, landslides, and flooding. Some high passes may be impassable. Always check current trail conditions with TAAN (Trekking Agencies Association of Nepal) before departing.",
        destination=dests[5]),
    SafetyAlert(title="Wildlife Safety in Chitwan", level="low",
        description="Always follow your guide's instructions when near rhinos, crocodiles, or elephants. Never approach wildlife independently. Stay on designated paths and do not make sudden movements or loud noises near animals.",
        destination=dests[3]),
    SafetyAlert(title="Earthquake Preparedness", level="medium",
        description="Nepal is in a seismically active zone. Familiarize yourself with evacuation routes in your accommodation. Keep emergency contacts and your embassy's number saved. Avoid old, unreinforced buildings during tremors.",
        destination=dests[4]),
    SafetyAlert(title="Upper Mustang Restricted Area Permit", level="high",
        description="Upper Mustang requires a special Restricted Area Permit costing $500 per person for 10 days. Trekking without this permit is illegal and can result in heavy fines. Permits must be arranged through a registered trekking agency.",
        destination=dests[14]),
])

# ------------------------------------------------------------
EmergencyContact.objects.bulk_create([
    EmergencyContact(name="Nepal Police",           service_type="police",         phone="100",            address="Naxal, Kathmandu",           available_24h=True),
    EmergencyContact(name="Ambulance Service",      service_type="ambulance",      phone="102",            address="Banshidhar, Kathmandu",       available_24h=True),
    EmergencyContact(name="Tourist Police",         service_type="tourist_police", phone="1144",           address="Bhrikutimandap, Kathmandu",   available_24h=True),
    EmergencyContact(name="Bir Hospital",           service_type="hospital",       phone="+977-1-4221119", address="Kantipath, Kathmandu",        available_24h=True),
    EmergencyContact(name="CIWEC Travel Medicine",  service_type="hospital",       phone="+977-1-4435232", address="Lazimpat, Kathmandu",         available_24h=False),
    EmergencyContact(name="Fire Brigade",           service_type="fire",           phone="101",            address="Tripureshwor, Kathmandu",     available_24h=True),
    EmergencyContact(name="Himalayan Rescue Assoc", service_type="hospital",       phone="+977-1-4440292", address="Thamel, Kathmandu",           available_24h=False),
])

print(f"\nDatabase seeded successfully!")
print(f"  {Category.objects.count()} categories")
print(f"  {Destination.objects.count()} destinations")
print(f"  {Hotel.objects.count()} hotels")
print(f"  {Guide.objects.count()} guides")
print(f"  {SafetyAlert.objects.count()} safety alerts")
print(f"  {EmergencyContact.objects.count()} emergency contacts")
print(f"\nAll images: permanent Unsplash URLs (no API key needed)")
