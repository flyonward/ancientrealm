// Card data transcribed from the print-and-play cards. Slots: a card is 3 block-slots wide.
const IMG='assets/cards/web300/', IMGHI='assets/cards/master600/';
const RES=['wheat','wood','stone'];
const ic=n=>`<img class="ic" src="assets/icons/${n}.png" alt="${n}">`;
const mk=(t,o)=>Object.assign({t,w:1},o);
const F=()=>mk('field',{nm:'Field',res:'wheat'}),Fo=()=>mk('forest',{nm:'Forest',res:'wood'}),Q=()=>mk('quarry',{nm:'Quarry',res:'stone'});
const M=(sc,arg)=>mk('mine',{nm:'Mine',sc,arg});
const CR=(cit,nm)=>mk('crown',{nm,cit}),CM=(cit,nm)=>mk('commoner',{nm,cit});
const MON=nm=>mk('monument',{nm,pts:2}),MIS=(nm,fx)=>mk('misfortune',{nm,fx,pts:4});
const WON=(nm,x,cost,pts,per,fx,txt)=>mk('wonder',{nm,x,w:2,cost,pts,per,fx,txt});
const lay=(arr)=>arr.map((b,i)=>b.t==='wonder'?b:Object.assign(b,{x:i}));
// blocks[].x = first slot (0..2). Wonder blocks span 2 slots.
const wlay=(wonderFirst,wb,other)=>wonderFirst?[Object.assign(wb,{x:0}),Object.assign(other,{x:2})]:[Object.assign(other,{x:0}),Object.assign(wb,{x:1})];
const CARDS={
 base_p2_r0_c0:{kind:'district',set:'base',blocks:lay([F(),CR('king','King'),M('perWonder')])},
 base_p2_r0_c1:{kind:'district',set:'base',blocks:lay([CR('treasurer','Treasurer'),M('moreComm'),Fo()])},
 base_p2_r0_c2:{kind:'district',set:'base',blocks:lay([M('adj',2),Q(),CR('queen','Queen')])},
 base_p2_r1_c0:{kind:'district',set:'base',blocks:lay([CM('mason','Mason'),M('perCrown'),F()])},
 base_p2_r1_c1:{kind:'district',set:'base',blocks:lay([Q(),CM('woodsman','Woodsman'),M('perRes')])},
 base_p2_r1_c2:{kind:'district',set:'base',blocks:lay([M('perAband'),Fo(),CM('farmer','Farmer')])},
 base_p4_r0_c0:{kind:'district',set:'base',blocks:lay([CM('bishop','Bishop'),M('adj',4),CR('collector','Collector')])},
 mm_p2_r0_c0:{kind:'district',set:'mm',blocks:lay([CR('planner','Planner'),MON('Arch'),MIS('Obsession','obsession')])},
 mm_p2_r0_c1:{kind:'district',set:'mm',blocks:lay([MIS('Earthquake','earthquake'),MON('Obelisk'),CM('builder','Builder')])},
 mm_p2_r0_c2:{kind:'district',set:'mm',blocks:lay([MIS('Drought','drought'),M('monAdj'),MON('Tower')])},
 mm_p2_r1_c0:{kind:'district',set:'mm',blocks:lay([MON('Column'),MIS('Strike','strike'),CR('advisor','Advisor')])},
 mm_p2_r1_c1:{kind:'district',set:'mm',blocks:lay([MON('Aqueduct'),M('noMisf'),MIS('Blight','blight')])},
 mm_p2_r1_c2:{kind:'district',set:'mm',blocks:lay([CM('salvager','Salvager'),MIS('Cave-In','cavein'),MON('Fountain')])},
 base_p4_r0_c1:{kind:'wonder',set:'base',blocks:wlay(1,WON('The Colossus',0,{wood:1,stone:2,wheat:3},8,'crown','colossus','Mines yield +1 gold'),Q())},
 base_p4_r0_c2:{kind:'wonder',set:'base',blocks:wlay(1,WON('The Temple of Artemis',0,{stone:2,wheat:2},5,0,'temple','Forests yield +1 wood'),M('grp'))},
 base_p4_r1_c0:{kind:'wonder',set:'base',blocks:wlay(1,WON('The Great Pyramids',0,{wood:2,stone:3,wheat:2},10,'commoner','pyramids','Building another wonder: gain 1 resource or 2 gold'),F())},
 base_p4_r1_c1:{kind:'wonder',set:'base',blocks:wlay(1,WON('The Statue of Zeus',0,{wood:2,stone:2,wheat:1},7,0,'zeus','Hire crown citizens free'),CM('merchant','Merchant'))},
 base_p4_r1_c2:{kind:'wonder',set:'base',blocks:wlay(0,WON('The Hanging Gardens',0,{wood:3,stone:1,wheat:2},9,0,'gardens','Hire commoner citizens free'),Fo())},
 base_p6_r0_c0:{kind:'wonder',set:'base',blocks:wlay(0,WON('The Mausoleum',0,{wood:2,stone:2},5,0,'mausoleum','Fields yield +1 wheat'),M('grp5'))},
 base_p6_r0_c1:{kind:'wonder',set:'base',blocks:wlay(0,WON('The Lighthouse',0,{wood:2,wheat:2},5,0,'lighthouse','Quarries yield +1 stone'),CR('supplier','Supplier'))},
};
// card -> flipped partner id (same row, mirrored column on the next page)
const back=id=>id.replace(/_p(\d+)_r(\d)_c(\d)/,(m,p,r,c)=>`_p${+p+1}_r${r}_c${2-c}`);
const EV={
 base_p3_r0_c0:['newplans','New Plans Are Drafted','Building a wonder: pay 1 less resource'],
 base_p3_r0_c1:['productivity','Productivity Abounds','Gathering: gain 1 more of the same resource'],
 base_p3_r0_c2:['goldrush','The Gold Rush Begins','Mines: gain 1 more gold'],
 base_p3_r1_c0:['bazaar','A Bustling Bazaar Opens','Trade 1 gold for 1 resource, twice per turn'],
 base_p3_r1_c1:['prosperity','Prosperity Graces the Land','Building a wonder: gain 2 gold'],
 base_p3_r1_c2:['caravan','A Caravan Arrives','Trade 1 resource for another, twice per turn'],
 base_p5_r0_c2:['unites','The Realm Unites','Hire citizens for free'],
 mm_p3_r0_c0:['treasury','The Treasury Reports a Profit','After placing a district: gain 2 gold'],
 mm_p3_r0_c1:['stockpile','A Stockpile of Stones Is Found','After placing a district: gain 1 stone'],
 mm_p3_r0_c2:['harvest','A Booming Harvest Is Here','After placing a district: gain 1 wheat'],
 mm_p3_r1_c0:['gods','The Gods Smile Upon You','Ignore all misfortune effects'],
 mm_p3_r1_c1:['economy','The Economy Strengthens','After covering a misfortune: gain 3 gold'],
 mm_p3_r1_c2:['forestb','The Forest Shares Its Bounty','After placing a district: gain 1 wood'],
};
// Leaders: [id, name, ...]; milestone = back card of the same sheet position
const LEADERS={
 l1_p2_r0_c0:['alex','Alexander the Great'],l1_p2_r0_c1:['caesar','Julius Caesar'],l1_p2_r0_c2:['cleo','Cleopatra'],
 l1_p2_r1_c0:['midas','Midas'],l1_p2_r1_c1:['ptolemy','Ptolemy'],l1_p2_r1_c2:['phidias','Phidias'],
 l2_p2_r0_c0:['artemisia','Artemisia II'],l2_p2_r0_c1:['khufu','Pharaoh Khufu'],l2_p2_r0_c2:['hammurabi','Hammurabi'],
 l2_p2_r1_c0:['ramses','Ramses II'],l2_p2_r1_c1:['xenophon','Xenophon'],l2_p2_r1_c2:['nero','Nero'],
 l3_p2_r0_c0:['nefertiti','Nefertiti'],l3_p2_r0_c1:['croesus','Croesus'],l3_p2_r0_c2:['hannibal','Hannibal'],
 l3_p2_r1_c0:['chares','Chares of Lindos'],l3_p2_r1_c1:['genghis','Genghis Khan'],l3_p2_r1_c2:['nebuchadnezzar','Nebuchadnezzar II'],
};
const MILESTONES={
 l1_p3_r0_c0:['spare','Spare no expenses','Build your second wonder','Wonders cost 1 extra gold to build'],
 l1_p3_r0_c1:['royal','Pay a royal sum','Activate a crown citizen','Crown citizens cost 2 extra gold (ignored with Statue of Zeus / Realm Unites)'],
 l1_p3_r0_c2:['raze','Raze the forest','Activate a forest','Quarries and fields cost 1 extra gold'],
 l1_p3_r1_c0:['evolve','Evolve the realm','Activate 3 blocks in one turn','Max 2 blocks activated per turn (may still cover 3)'],
 l1_p3_r1_c1:['stimulate','Stimulate the economy','Buy a resource with 2 gold','Buying costs 3 gold (ignored during A Bustling Bazaar Opens)'],
 l1_p3_r1_c2:['honor','Honor the wonders','Build a wonder adjacent to a mine','No blocks may be activated when placing a wonder'],
 l2_p3_r0_c0:['endure','Endure an uneventful era','Add your second district card','District events are ignored until 1 wonder card remains'],
 l2_p3_r0_c1:['ambition','Pay for your ambition','Build your third wonder','Wonders cost 1 extra resource of your choice'],
 l2_p3_r0_c2:['shortage','Suffer a gold shortage','Activate a mine','Mines yield 1 less gold (ignored during The Gold Rush Begins)'],
 l2_p3_r1_c0:['hireless','Hire less, expand more','Have 4+ citizens in the realm','Market cards are replaced from the matching deck'],
 l2_p3_r1_c1:['bide','Bide your time','Have 3 wonders in the market','Built wonder effects are off until the district deck is empty'],
 l2_p3_r1_c2:['push','Push for progress','Flip a storage card to its 4-7 side','Storage capacity is now 5 each'],
 l3_p3_r0_c0:['brace','Brace for increased costs','Activate a field','Forests and quarries cost 1 extra gold'],
 l3_p3_r0_c1:['moderation','Everything in moderation','Have a field, forest and quarry in the realm','Max 1 field/forest/quarry activation per turn'],
 l3_p3_r0_c2:['overwork',"Don't overwork your citizens",'Build a wonder worth exactly 5 points','Max 1 citizen activated per turn'],
 l3_p3_r1_c0:['expensive','Manage an expensive realm','Activate a quarry','Forests and fields cost 1 extra gold'],
 l3_p3_r1_c1:['judicious','Be judicious with gold','Abandon a wonder and collect the benefit','Abandoning a wonder can no longer give 2 gold'],
 l3_p3_r1_c2:['commoners','Reward the commoners','Activate a commoner citizen','Commoner citizens cost 2 extra gold (ignored with Hanging Gardens / Realm Unites)'],
};
