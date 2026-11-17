import csv,json,sys
D='/home/claude/usda/FoodData_Central_sr_legacy_food_csv_2018-04/'
# key, display name, fdc_id, toddler portion g, group, shopping aisle, match words
F=[
("chicken_thigh","Chicken thigh",173627,40,"protein","Meat & fish","chicken thigh|chicken thighs|chicken wings|wings|chicken"),
("chicken_breast","Chicken breast",171077,40,"protein","Meat & fish","chicken breast|chicken strips|shredded chicken"),
("chicken_mince","Chicken mince",171116,40,"protein","Meat & fish","chicken mince"),
("beef_mince","Beef mince",171796,40,"protein","Meat & fish","beef mince|meatballs|meatball|beef|bolognese"),
("lamb_mince","Lamb mince",174370,40,"protein","Meat & fish","lamb"),
("salmon","Salmon",175167,40,"protein","Meat & fish","salmon"),
("cod","Cod / white fish",171955,40,"protein","Meat & fish","cod|hake|white fish|fish"),
("sardines","Sardines (tinned)",175139,30,"protein","Tins & dry","sardine|sardines"),
("egg","Egg",171287,50,"protein","Dairy & eggs","egg|eggs|omelette|frittata"),
("lentils_red","Red lentils (dry)",174284,20,"protein","Tins & dry","red lentils|lentils|lentil"),
("lentils_brown","Brown lentils (dry)",172420,20,"protein","Tins & dry","brown lentils"),
("chickpeas","Chickpeas (tinned)",173801,30,"protein","Tins & dry","chickpeas|chickpea"),
("hummus","Hummus",172454,20,"protein","Fridge","hummus"),
("greek_yoghurt","Greek yoghurt",171304,60,"dairy","Dairy & eggs","greek yoghurt|yoghurt|yogurt|tzatziki"),
("cheddar","Cheddar / mild cheese",170899,15,"dairy","Dairy & eggs","cheese cubes|cheese|cheddar"),
("ricotta","Ricotta",170851,30,"dairy","Dairy & eggs","ricotta"),
("feta","Feta",173420,10,"dairy","Dairy & eggs","feta"),
("mozzarella","Mozzarella",170845,15,"dairy","Dairy & eggs","mozzarella"),
("milk","Whole milk",171265,100,"dairy","Dairy & eggs","milk"),
("butter","Butter",173410,5,"extra","Dairy & eggs","butter"),
("olive_oil","Olive oil",171413,5,"extra","Tins & dry","olive oil"),
("oats","Oats",169705,20,"grain","Tins & dry","oats|oat|porridge"),
("rice","Rice (dry)",168931,20,"grain","Tins & dry","rice"),
("pasta","Pasta / orzo (dry)",169736,25,"grain","Tins & dry","pasta|orzo|penne|fusilli"),
("bread","Wholemeal bread",172688,25,"grain","Bakery","bread|toast|eggy bread"),
("pitta","Pitta",174915,25,"grain","Bakery","pitta|pita"),
("filo","Filo pastry",172791,10,"grain","Fridge","filo|phyllo"),
("flour","Plain flour",168894,10,"grain","Tins & dry","flour"),
("sr_flour","Self-raising flour",168895,10,"grain","Tins & dry","self-raising flour"),
("breadcrumbs","Breadcrumbs",174924,10,"grain","Bakery","breadcrumbs"),
("quinoa","Quinoa (dry)",168874,20,"grain","Tins & dry","quinoa"),
("bulgur","Bulgur (dry)",170688,20,"grain","Tins & dry","bulgur"),
("couscous","Couscous (dry)",169699,20,"grain","Tins & dry","couscous"),
("potato","Potato",170026,60,"grain","Fruit & veg","potato wedges|potatoes|potato|wedges"),
("sweet_potato","Sweet potato",168482,50,"veg","Fruit & veg","sweet potato"),
("carrot","Carrot",170393,30,"veg","Fruit & veg","carrots|carrot"),
("spinach","Spinach",168462,20,"veg","Fruit & veg","spinach"),
("broccoli","Broccoli",170379,30,"veg","Fruit & veg","broccoli"),
("courgette","Courgette",169291,30,"veg","Fruit & veg","courgette|zucchini"),
("peas","Peas",170017,20,"veg","Freezer","peas"),
("green_beans","Green beans",169961,30,"veg","Fruit & veg","green beans|beans"),
("tomato","Tomato",170457,30,"veg","Fruit & veg","cherry tomatoes|tomatoes|tomato"),
("passata","Passata",170460,30,"veg","Tins & dry","passata|tomato sauce"),
("tomato_paste","Tomato paste",170459,5,"extra","Tins & dry","tomato paste"),
("cucumber","Cucumber",168409,30,"veg","Fruit & veg","cucumber"),
("onion","Onion",170000,10,"extra","Fruit & veg","onion"),
("spring_onion","Spring onion",170005,5,"extra","Fruit & veg","spring onion"),
("red_pepper","Red pepper",170108,30,"veg","Fruit & veg","pepper|peppers"),
("cauliflower","Cauliflower",169986,30,"veg","Fruit & veg","cauliflower"),
("pumpkin","Pumpkin",168448,30,"veg","Fruit & veg","pumpkin|squash"),
("beetroot","Beetroot",169145,30,"veg","Fruit & veg","beetroot|beet"),
("avocado","Avocado",171705,30,"fruit","Fruit & veg","avocado"),
("banana","Banana",173944,50,"fruit","Fruit & veg","banana"),
("apple","Apple",171688,50,"fruit","Fruit & veg","apple"),
("pear","Pear",169118,50,"fruit","Fruit & veg","pear"),
("blueberries","Blueberries",171711,40,"fruit","Fruit & veg","blueberries|blueberry|berries|berry"),
("strawberries","Strawberries",167762,40,"fruit","Fruit & veg","strawberries|strawberry"),
("raspberries","Raspberries",167755,40,"fruit","Fruit & veg","raspberries|raspberry"),
("mango","Mango",169910,40,"fruit","Fruit & veg","mango"),
("kiwi","Kiwi",168153,40,"fruit","Fruit & veg","kiwi"),
("orange","Orange",169097,40,"fruit","Fruit & veg","orange|clementine|satsuma|mandarin"),
("peach","Peach",169928,50,"fruit","Fruit & veg","peach|nectarine"),
("melon","Melon",169092,50,"fruit","Fruit & veg","melon"),
("grapes","Grapes",174683,40,"fruit","Fruit & veg","grapes|grape"),
("dates","Dates",168191,10,"fruit","Tins & dry","dates|date"),
("almonds","Ground almonds",170567,8,"extra","Tins & dry","almonds|almond"),
("peanut_butter","Peanut butter (no salt)",172470,8,"extra","Tins & dry","peanut butter|nut butter"),
("tahini","Tahini",170189,8,"extra","Tins & dry","tahini|sesame"),
("chia","Chia seeds",170554,5,"extra","Tins & dry","chia"),
("flax","Ground flaxseed",169414,5,"extra","Tins & dry","flax"),
("coconut","Desiccated coconut",170170,5,"extra","Tins & dry","coconut"),
("parsley","Parsley / dill",170416,2,"extra","Fruit & veg","parsley|dill|herbs"),
("lemon","Lemon juice",167747,5,"extra","Fruit & veg","lemon"),
]
N={1008:"kcal",1003:"protein",1004:"fat",1079:"fibre",1087:"calcium",1089:"iron",1095:"zinc",1106:"vitA",1162:"vitC",1114:"vitD",1272:"dha",1278:"epa"}
ids={f[2] for f in F}
names={r['fdc_id']:r['description'] for r in csv.DictReader(open(D+'food.csv')) if int(r['fdc_id']) in ids}
vals={}
for r in csv.DictReader(open(D+'food_nutrient.csv')):
    fid=int(r['fdc_id']); nid=int(r['nutrient_id'])
    if fid in ids and nid in N:
        vals.setdefault(fid,{})[N[nid]]=float(r['amount'])
out={}
for key,name,fdc,por,grp,aisle,words in F:
    v=vals.get(fdc,{})
    n={k:round(v.get(k,0),3) for k in ["kcal","protein","fat","fibre","calcium","iron","zinc","vitA","vitC","vitD"]}
    n["omega3"]=round((v.get("dha",0)+v.get("epa",0))*1000,1)  # mg DHA+EPA
    out[key]={"name":name,"fdc":fdc,"usda":names[str(fdc)],"portion":por,"group":grp,"aisle":aisle,"words":words.split("|"),"per100":n}
    missing=[k for k in ["kcal","protein","calcium","iron"] if k not in v]
    if missing: print("MISSING",key,missing,file=sys.stderr)
js=json.dumps(out,separators=(",",":"))
open('/home/claude/ari-meals/netlify/lib/foods.mjs','w').write("// Nutrients per 100 g from USDA FoodData Central, SR Legacy (April 2018 release). Generated, do not edit by hand.\nexport const FOODS="+js+";\n")
open('/home/claude/ari-meals/public/foods.js','w').write("// Nutrients per 100 g from USDA FoodData Central, SR Legacy (April 2018 release).\nwindow.FOODS="+js+";\n")
print(len(out),"foods",len(js),"bytes")
for k in ["carrot","beef_mince","salmon","greek_yoghurt","lentils_red","spinach","egg"]: print(k,out[k]["per100"])
