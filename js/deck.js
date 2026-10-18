// GabMad Deck of Phonetic Puzzles
// g: Gibberish phrase (phonetic)
// a: Real answer
// c: Category
// hint: Optional context clue

const DECK = [
  // --- REAL MAD GAB CLASSICS ---
  { g: "Easel Aid Ease Man", a: "He's a ladies' man", c: "Classic", hint: "A charming fellow" },
  { g: "Know Sayer", a: "Nose hair", c: "Classic", hint: "Something you trim" },
  { g: "Ease Ace Life Ox", a: "He's a sly fox", c: "Classic", hint: "Sneaky person" },
  { g: "Eye Pillow Fizz Sigh", a: "Apple of his eye", c: "Idiom", hint: "Someone dearly cherished" },
  { g: "Eight Wean Gull Any Size", a: "A twinkle in his eye", c: "Idiom", hint: "Mischievous spark" },
  { g: "Stirring Beak He Knee", a: "String bikini", c: "Classic", hint: "Beachwear" },
  { g: "Of Lions Quarrel", a: "A flying squirrel", c: "Animal", hint: "Gliding woodland creature" },
  { g: "Abe Who Beat Wrap", a: "A booby trap", c: "Classic", hint: "Indiana Jones hazard" },
  { g: "Dawned Rink Hand Arrive", a: "Don't drink and drive", c: "Classic", hint: "Road safety motto" },
  { g: "You Shore New Dull", a: "Use your noodle", c: "Idiom", hint: "Think carefully!" },
  { g: "Why Tail Huff Hunt", a: "White elephant", c: "Classic", hint: "Gift exchange game" },
  { g: "Dew Wino Hue", a: "Do I know you?", c: "Classic", hint: "Familiar stranger" },
  { g: "Sea Can't Higher Dove Fit", a: "Sick and tired of it", c: "Idiom", hint: "Completely fed up" },
  { g: "Ape Hand Hub Hair", a: "A panda bear", c: "Animal", hint: "Bamboo eater" },
  { g: "Pretty Shack Scent", a: "British accent", c: "Classic", hint: "London dialect" },
  { g: "Hiney Duck Hiss", a: "I need a kiss", c: "Classic", hint: "Romantic plea" },
  { g: "Bail Heed Ant Sir", a: "Belly dancer", c: "Classic", hint: "Rhythmic performer" },
  { g: "Pooh Teal Is Shush", a: "Bootylicious", c: "Pop Culture", hint: "Destiny's Child bop" },
  { g: "Dawned Pea Hugger Limb Ann", a: "Don't be a girly man", c: "Classic", hint: "Classic 90s catchphrase" },
  { g: "Mike Ranch Healed Wren", a: "My grandchildren", c: "Everyday", hint: "Family generations" },
  { g: "Dwell Fro Sis", a: "Twelve roses", c: "Everyday", hint: "Valentine's bouquet" },
  { g: "Up Arrow Tin Issues", a: "A pair of tennis shoes", c: "Everyday", hint: "Footwear for running" },
  { g: "Ail Huck Each Arm", a: "A lucky charm", c: "Classic", hint: "Good fortune trinket" },
  { g: "Weedy Man Done Ant Sir", a: "We demand an answer", c: "Everyday", hint: "Press conference cry" },
  { g: "Owe Forth Account Herd Rug", a: "Over-the-counter drug", c: "Everyday", hint: "Pharmacy shelf remedy" },
  { g: "House Wheat This Hound", a: "How sweet the sound", c: "Classic", hint: "Amazing Grace lyric" },
  { g: "Fin Skate", a: "Fence gate", c: "Everyday", hint: "Backyard latch" },
  { g: "Assess Seam Ease Heed", a: "A sesame seed", c: "Food", hint: "On a burger bun" },
  { g: "House The Why Funk Heads", a: "How's the wife and kids?", c: "Everyday", hint: "Small talk greeting" },
  { g: "Us Punk Kick Hid", a: "A spunky kid", c: "Everyday", hint: "High-spirited child" },
  { g: "Ache Inks High Sped", a: "A king size bed", c: "Everyday", hint: "Spacious mattress" },

  // --- IDIOMS & PHRASES ---
  { g: "Dye A Mundane The Ruff", a: "Diamond in the rough", c: "Idiom", hint: "Hidden gem of talent" },
  { g: "Cats Pudge Amos", a: "Cat's pajamas", c: "Idiom", hint: "The bees knees" },
  { g: "Kittle Cabb Oodle", a: "Kit and caboodle", c: "Idiom", hint: "The whole entire thing" },
  { g: "Bite Thee Bullet", a: "Bite the bullet", c: "Idiom", hint: "Face a tough situation" },
  { g: "Break A Leg", a: "Break a leg", c: "Idiom", hint: "Showbiz good luck" },
  { g: "Bark King Up Thee Wrong Tree", a: "Barking up the wrong tree", c: "Idiom", hint: "Looking in the wrong place" },
  { g: "Cost Stand Arm Hand A Leg", a: "Cost an arm and a leg", c: "Idiom", hint: "Extremely expensive" },
  { g: "Cry Over Spilt Mil K", a: "Cry over spilt milk", c: "Idiom", hint: "No use regretting the past" },
  { g: "Hit Thaw Sack", a: "Hit the sack", c: "Idiom", hint: "Go to sleep" },
  { g: "Peas Soph Cake", a: "Piece of cake", c: "Idiom", hint: "Super easy task" },
  { g: "Spill Thaw Beans", a: "Spill the beans", c: "Idiom", hint: "Reveal the secret" },
  { g: "Blessing In Dis Guys", a: "Blessing in disguise", c: "Idiom", hint: "Good thing that seemed bad" },
  { g: "Bull Loin Smoke", a: "Blowing smoke", c: "Idiom", hint: "Exaggerating or bluffing" },
  { g: "Can Tough Worms", a: "Can of worms", c: "Idiom", hint: "Messy complex problem" },
  { g: "Drop In The Bucket", a: "Drop in the bucket", c: "Idiom", hint: "A tiny fraction" },

  // --- FOOD & DRINK ---
  { g: "Wooster Sheer Sauce", a: "Worcestershire sauce", c: "Food", hint: "Hard-to-pronounce condiment" },
  { g: "Brew Sketta", a: "Bruschetta", c: "Food", hint: "Toasted bread with tomatoes" },
  { g: "Rat A Too Ee", a: "Ratatouille", c: "Food", hint: "French vegetable stew or movie" },
  { g: "Duck A Low Range", a: "Duck à l'orange", c: "Food", hint: "Classic French roast" },
  { g: "Aches Ben A Dikt", a: "Eggs benedict", c: "Food", hint: "Brunch favorite with hollandaise" },
  { g: "Chick In Core Dawn Blue", a: "Chicken cordon bleu", c: "Food", hint: "Stuffed chicken with ham & cheese" },
  { g: "Spa Get Tee Car Bone Ara", a: "Spaghetti carbonara", c: "Food", hint: "Roman egg & pancetta pasta" },
  { g: "Walk A Mole E", a: "Guacamole", c: "Food", hint: "Avocado dip" },
  { g: "Kay Sa Dee Ya", a: "Quesadilla", c: "Food", hint: "Folded cheesy tortilla" },
  { g: "Knot Chose", a: "Nachos", c: "Food", hint: "Tortilla chips with cheese" },
  { g: "One Ton Soup", a: "Wonton soup", c: "Food", hint: "Chinese dumpling broth" },
  { g: "Ed A Mommy", a: "Edamame", c: "Food", hint: "Steamed salted soybeans" },
  { g: "Shar Coot Uh Ree", a: "Charcuterie", c: "Food", hint: "Meat and cheese board" },
  { g: "Hal A Pain Yo", a: "Jalapeño", c: "Food", hint: "Spicy green pepper" },
  { g: "Caramel Macky Otto", a: "Caramel macchiato", c: "Food", hint: "Starbucks espresso drink" },
  { g: "Croix Saunt", a: "Croissant", c: "Food", hint: "Flaky buttery pastry" },
  { g: "Fish Hand Chips", a: "Fish and chips", c: "Food", hint: "British pub staple" },
  { g: "Bar Be Queue Rips", a: "Barbecue ribs", c: "Food", hint: "Smoky tender meat" },
  { g: "Ice Cream Cone", a: "Ice cream cone", c: "Food", hint: "Summer scoop on a wafer" },

  // --- POP CULTURE & MOVIES ---
  { g: "Star Wors A New Hope", a: "Star Wars: A New Hope", c: "Movies", hint: "Luke Skywalker's beginning" },
  { g: "May The Force Be With You", a: "May the force be with you", c: "Movies", hint: "Jedi blessing" },
  { g: "Toy Store E", a: "Toy Story", c: "Movies", hint: "Woody and Buzz Lightyear" },
  { g: "Harry Potted Anne The Sorcerer Stone", a: "Harry Potter and the Sorcerer's Stone", c: "Movies", hint: "Boy wizard starts at Hogwarts" },
  { g: "Fee Own Say", a: "Beyoncé", c: "Pop Culture", hint: "Queen Bey" },
  { g: "Tailor Swift", a: "Taylor Swift", c: "Pop Culture", hint: "The Eras Tour icon" },
  { g: "Spider Man No Way Home", a: "Spider-Man: No Way Home", c: "Movies", hint: "Multiverse web slinger" },
  { g: "The Lion King", a: "The Lion King", c: "Movies", hint: "Simba's circle of life" },
  { g: "Jur Ass Sick Park", a: "Jurassic Park", c: "Movies", hint: "Dinosaurs running loose" },
  { g: "Law Duff There Inks", a: "Lord of the Rings", c: "Movies", hint: "Journey to Mordor" },
  { g: "Back To The Few Chore", a: "Back to the Future", c: "Movies", hint: "Marty and Doc in a DeLorean" },
  { g: "Ghost Bust Hers", a: "Ghostbusters", c: "Movies", hint: "Who you gonna call?" },
  { g: "Barbie World", a: "Barbie world", c: "Pop Culture", hint: "Life in plastic, it's fantastic" },

  // --- ANIMALS & NATURE ---
  { g: "Hip Hop Pot A Moose", a: "Hippopotamus", c: "Animal", hint: "Large river mammal" },
  { g: "Rye Noss Er Ross", a: "Rhinoceros", c: "Animal", hint: "Horned herbivore" },
  { g: "Chimp Pansy", a: "Chimpanzee", c: "Animal", hint: "Smart primate" },
  { g: "Plaque Tip Us", a: "Platypus", c: "Animal", hint: "Egg-laying duck-billed mammal" },
  { g: "Pork You Pine", a: "Porcupine", c: "Animal", hint: "Quill-covered creature" },
  { g: "Came L Toe", a: "Camel toe", c: "Animal", hint: "Two-toed desert beast foot" },
  { g: "Flaming Go", a: "Flamingo", c: "Animal", hint: "Pink standing bird" },
  { g: "Baldy Gull", a: "Bald eagle", c: "Animal", hint: "American symbol bird" },
  { g: "Grizzly Bear", a: "Grizzly bear", c: "Animal", hint: "Ferocious northern woods beast" },
  { g: "Humming Bird", a: "Hummingbird", c: "Animal", hint: "Rapid-wing pollinator" },

  // --- TOUGH WORDS & TONGUE TWISTERS ---
  { g: "Flab Her Gassed It", a: "Flabbergasted", c: "Tough Word", hint: "Astounded and shocked" },
  { g: "Dis Cum Bob You Lay Ted", a: "Discombobulated", c: "Tough Word", hint: "Confused and disoriented" },
  { g: "Byur Ahh Crossy", a: "Bureaucracy", c: "Tough Word", hint: "Red tape administration" },
  { g: "Own A Mat A Pee A", a: "Onomatopoeia", c: "Tough Word", hint: "Words like buzz, zap, sizzle" },
  { g: "Chris Anthem Um", a: "Chrysanthemum", c: "Tough Word", hint: "Colorful autumn flower" },
  { g: "New Moan Ya", a: "Pneumonia", c: "Tough Word", hint: "Lung infection" },
  { g: "Sue Purr Cal Lee Fragile Istick Sex Pee Ally Dough Shush", a: "Supercalifragilisticexpialidocious", c: "Tough Word", hint: "Mary Poppins song" },
  { g: "Knee Knee She At Tiff", a: "Initiative", c: "Tough Word", hint: "Taking the lead" },
  { g: "Miss Cheek Us", a: "Mischievous", c: "Tough Word", hint: "Playfully naughty" },
  { g: "Par A Duck Sick All", a: "Paradoxical", c: "Tough Word", hint: "Self-contradictory statement" },
  { g: "Puff Fick Shun East", a: "Perfectionist", c: "Tough Word", hint: "Must be flawless" },
  { g: "Pro Crap Stun Eight", a: "Procrastinate", c: "Tough Word", hint: "Putting things off till tomorrow" },

  // --- FAMOUS PLACES & GEOGRAPHY ---
  { g: "Stat Chew Off Liberty", a: "Statue of Liberty", c: "Places", hint: "New York harbor landmark" },
  { g: "Mount Rush More", a: "Mount Rushmore", c: "Places", hint: "Presidential faces carved in granite" },
  { g: "Grand Canyon", a: "Grand Canyon", c: "Places", hint: "Arizona colossal gorge" },
  { g: "Eye Full Tower", a: "Eiffel Tower", c: "Places", hint: "Paris wrought-iron icon" },
  { g: "Great Wall Of China", a: "Great Wall of China", c: "Places", hint: "Massive defensive stone barrier" },
  { g: "Times Square", a: "Times Square", c: "Places", hint: "Broadway neon crossroads" },
  { g: "Golden Gate Bridge", a: "Golden Gate Bridge", c: "Places", hint: "San Francisco orange suspension bridge" },
  { g: "Niagara Falls", a: "Niagara Falls", c: "Places", hint: "Thundering border waterfall" },

  // --- EVERYDAY FUN & SLANG ---
  { g: "No Cap", a: "No cap", c: "Slang", hint: "For real, no lie" },
  { g: "Main Character Energy", a: "Main character energy", c: "Slang", hint: "Living life like you're the star" },
  { g: "Touch Grass", a: "Touch grass", c: "Slang", hint: "Go outside and log off" },
  { g: "Rent Free In My Head", a: "Rent free in my head", c: "Slang", hint: "Can't stop thinking about it" },
  { g: "Tea Spill", a: "Spill the tea", c: "Slang", hint: "Share the juicy gossip" },
  { g: "Ghosting", a: "Ghosting", c: "Slang", hint: "Disappearing without replying" },
  { g: "Vibe Check", a: "Vibe check", c: "Slang", hint: "Assessing the room's energy" },
  { g: "Broke The Internet", a: "Broke the internet", c: "Slang", hint: "Viral sensation frenzy" },

  // --- IMPORTED FLASHCARDS ---
  { g: "Abe Odd Hull Luck Oak", a: "A bottle of Coke", c: "Food" },
  { g: "Ape Arrows Uncle As His", a: "A pair of sunglasses", c: "Everyday" },
  { g: "Canoe Key Pace He Grit", a: "Can you keep a secret?", c: "Everyday" },
  { g: "Date Roy Pea Stuns", a: "Detroit Pistons", c: "Sports" },
  { g: "Dawn Dude Rugs", a: "Don't do drugs", c: "Everyday" },
  { g: "Jog Clay Die Scream", a: "Chocolate Ice Cream", c: "Food" },
  { g: "Moe's Art", a: "Mozart", c: "Music" },
  { g: "My Kojak Sun", a: "Michael Jackson", c: "Music" },
  { g: "Pie Rate Softy Care Hip Been", a: "Pirates of the Caribbean", c: "Movies" },
  { g: "Sand Tack Laws", a: "Santa Claus", c: "Pop Culture" },
  { g: "Thick Awe Loved Hoot He", a: "The Call of Duty", c: "Games" },
  { g: "Thick Hull Foam Heck Sicko", a: "The Gulf of Mexico", c: "Places" },
  { g: "Day Fed Peck Calm", a: "David Beckham", c: "Sports" },
  { g: "Hair Rose Myth", a: "Aerosmith", c: "Music" },
  { g: "Caress Peak Reamed Hone Huts", a: "Krispy Kreme Doughnuts", c: "Food" },
  { g: "Is Bunch Pops Queer Pans", a: "SpongeBob SquarePants", c: "Movies" },
  { g: "Wand Doll Iran Dense Hence", a: "One Dollar and Ten Cents", c: "Everyday" },
  { g: "Sit Jerk Lock", a: "Set Your Clock", c: "Everyday" },
  { g: "Paw Rolfe Eye Owe Lay Shun", a: "Parole Violation", c: "Everyday" },
  { g: "I'm Issues Home Hutch", a: "I Miss You So Much", c: "Everyday" },
  { g: "Finesse Aah Wheel Yams", a: "Vanessa Williams", c: "Music" },
  { g: "Dawn Dutch Mice Tough", a: "Don't Touch My Stuff", c: "Everyday" },
  { g: "Bat Tree Snot Ink Looted", a: "Batteries Not Included", c: "Movies" },
  { g: "Ease Sung Gopher", a: "He's Hungover", c: "Everyday" },
  { g: "High Dance Eek", a: "Hide and Seek", c: "Games" },
  { g: "Maid Fur Reach Hover", a: "Made for Each Other", c: "Idiom" },
  { g: "Pomp Eyelet", a: "Palm Pilot", c: "Technology" },
  { g: "Thief Act Huff Them Adder", a: "The Fact of the Matter", c: "Idiom" },
  { g: "Whole Imp Pig Aims", a: "Olympic Games", c: "Sports" },
  { g: "Tray Sure Aisle Hand", a: "Treasure Island", c: "Places" },
  { g: "Police Bees Eerie Us", a: "Please Be Serious", c: "Everyday" },
  { g: "Lee On Hard Odie Cap Rio", a: "Leonardo DiCaprio", c: "Pop Culture" },
  { g: "Frumps Hero Dues Hicks Tee", a: "From Zero to Sixty", c: "Everyday" },
  { g: "Canoes He Wad Ice He", a: "Can You See What I See?", c: "Everyday" },
  { g: "Eighth Reap Ease Hoot", a: "A Three-Piece Suit", c: "Everyday" },
  { g: "Hugh Essay Tude Hay", a: "USA Today", c: "Pop Culture" },
  { g: "Mare Itch Prop Owes All", a: "Marriage Proposal", c: "Everyday" },
  { g: "Raw Key Ant Bull Wink Hill", a: "Rocky and Bullwinkle", c: "Movies" },
  { g: "These Hound Doff Moo Sick", a: "The Sound of Music", c: "Movies" },
  { g: "Watts Ford Inner", a: "What's for Dinner", c: "Food" },
  { g: "She Cargo Ill Annoy", a: "Chicago, Illinois", c: "Places" },
  { g: "Eye Ham Width Stew Ped", a: "I Am with Stupid", c: "Everyday" },
  { g: "Gay Duds Hun", a: "Kate Hudson", c: "Pop Culture" },
  { g: "Joan Hay Myth", a: "Joe Namath", c: "Sports" },
  { g: "We Knit Train Sip Oars", a: "When It Rains, It Pours", c: "Idiom" },
  { g: "Manna Cue Her", a: "Manicure", c: "Everyday" },
  { g: "Newer Leans Ain'ts", a: "New Orleans Saints", c: "Sports" },
  { g: "Read Hick Yule Us", a: "Ridiculous", c: "Tough Word" },
  { g: "Theme Ask Cough Sore Owe", a: "The Mask of Zorro", c: "Movies" },
  { g: "Gnu Your Cassidy", a: "New York City", c: "Places" },
  { g: "Holes Ale Pry Says", a: "Wholesale Prices", c: "Everyday" },
  { g: "Eight Up Aware Par Tee", a: "A Tupperware Party", c: "Everyday" },
  { g: "I'm On Stairs Sink", a: "Monsters, Inc.", c: "Movies" },
  { g: "Hoop Side Hid Ditto Ken", a: "Oops! I Did It Again", c: "Music" },
  { g: "Mine Ore A Teary Port", a: "Minority Report", c: "Movies" },
  { g: "Rot Into Thick Oar", a: "Rotten to the Core", c: "Idiom" },
  { g: "Thesis Sawn Who Tomb He", a: "This Is All New to Me", c: "Everyday" },
  { g: "Thy Pup Dispelled Chews", a: "Wipe Up the Spilled Juice", c: "Everyday" },
  { g: "Thief Wrench Con Eggs Shun", a: "The French Connection", c: "Movies" },
  { g: "Sea Yule Hater", a: "See You Later", c: "Everyday" },
  { g: "Old Sunned Wins", a: "Olsen Twins", c: "Pop Culture" },
  { g: "Manner Four", a: "Man-of-War", c: "Animal" },
  { g: "Who Why Inn Sir Fur", a: "Hawaiian Surfer", c: "Everyday" },
  { g: "Fun Ella Eyes", a: "Vanilla Ice", c: "Music" },
  { g: "Deep Rinse Soft Ides", a: "The Prince of Tides", c: "Movies" },
  { g: "Hay Tease Hicks", a: "Eighty-Six", c: "Everyday" },
  { g: "Jeweler Rob Hurts", a: "Julia Roberts", c: "Pop Culture" },
  { g: "Minnie Soda Vie Kinks", a: "Minnesota Vikings", c: "Sports" },
  { g: "Seal Indy Yon", a: "Celine Dion", c: "Music" },
  { g: "Thigh Sing Gone Thick Ache", a: "The Icing on the Cake", c: "Idiom" },
  { g: "Why Emcee Hay", a: "YMCA", c: "Music" },
  { g: "Theme Are Ink Ore", a: "The Marine Corps", c: "Pop Culture" },
  { g: "Poise Tomb Hen", a: "Boyz II Men", c: "Music" },
  { g: "Mar Thus Do Hurt", a: "Martha Stewart", c: "Pop Culture" },
  { g: "Duck Turd Ray", a: "Dr. Dre", c: "Music" },
  { g: "Gown Tink Rows", a: "Counting Crows", c: "Music" },
  { g: "Hum Eric A Nair Lions", a: "American Airlines", c: "Travel" },
  { g: "May Cuss Suck Jest Chin", a: "Make a Suggestion", c: "Everyday" },
  { g: "Par Keens Pace", a: "Parking Space", c: "Everyday" },
  { g: "Rome He Owe Hand Jewelry Yet", a: "Romeo and Juliet", c: "Movies" },
  { g: "Thief Han Tomb Hen Is", a: "The Phantom Menace", c: "Movies" },
  { g: "Wide Hidden Chews Haze Hoe", a: "Why Didn't You Say So?", c: "Everyday" },
  { g: "Tap Lloyd Noose Pay Purse", a: "Tabloid Newspapers", c: "Pop Culture" },
  { g: "Fee Nicks Huns", a: "Phoenix Suns", c: "Sports" },
  { g: "Hit Stoop Add", a: "It's Too Bad", c: "Everyday" },
  { g: "May Churl Eek Bays Paul", a: "Major League Baseball", c: "Sports" },
  { g: "Poe Little Key Ink Oar Wrecked", a: "Politically Incorrect", c: "Idiom" },
  { g: "Sue Purse Eye Smee", a: "Super Size Me", c: "Movies" },
  { g: "Wall Come Island Mash Ooze", a: "Walk a Mile in My Shoes", c: "Idiom" },
  { g: "Pen Silly Raise Her", a: "Pencil Eraser", c: "Everyday" },
  { g: "June Hoe Hull Ask Her", a: "Juneau, Alaska", c: "Places" },
  { g: "For Dee Hay Towers", a: "48 Hours", c: "Movies" },
  { g: "Deep Each Poise", a: "The Beach Boys", c: "Music" },
  { g: "Hoe Min Proof Mint", a: "Home Improvement", c: "Movies" },
  { g: "Mash Who Sun Tide", a: "My Shoe's Untied", c: "Everyday" },
  { g: "Prints Jar Else", a: "Prince Charles", c: "Pop Culture" },
  { g: "Toy Ordor Terse Sell", a: "Toyota Tercel", c: "Everyday" },
  { g: "Wren Tough Id He Owe", a: "Rent a Video", c: "Everyday" }
];

// Helper to shuffle a copy of the deck
function getShuffledDeck(categoryFilter = null, limit = null) {
  let pool = DECK.slice();
  if (categoryFilter && categoryFilter !== "All") {
    pool = pool.filter(card => card.c.toLowerCase() === categoryFilter.toLowerCase());
  }
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  if (limit && limit > 0) {
    return pool.slice(0, limit);
  }
  return pool;
}

function getDeckCategories() {
  return [...new Set(DECK.map(card => card.c))].sort((a, b) => a.localeCompare(b));
}

if (typeof window !== "undefined") {
  window.DECK = DECK;
  window.getShuffledDeck = getShuffledDeck;
  window.getDeckCategories = getDeckCategories;
}

if (typeof module !== "undefined" && module.exports) {
  module.exports = { DECK, getShuffledDeck, getDeckCategories };
}
