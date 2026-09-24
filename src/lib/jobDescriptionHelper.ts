import { JobPostDetail, PostRecord } from '../types';

export interface RichJobDescription {
  intro: string;
  whatIsThisJob: string;
  workProfile: string;
  eligibilityExplanation: string;
  basicDocuments: string[];
  selectionProcess: string;
  whyApply: string;
  fullMarkdown: string;
  aboutParagraphs: string[];
  selectionStages: string[];
}

/**
 * Generates an authoritative, AI-optimized, humanized Hindi editorial explanation
 * for any government or corporate job post on NP Job Portal.
 * Resolves whether the post has pre-existing description/content or synthesizes
 * high-value domain-specific explanations so NO post is ever bare.
 */
export function getRichJobDescription(job: Partial<JobPostDetail | PostRecord>): RichJobDescription {
  const title = (job.title || '').trim();
  const shortTitle = (job.shortTitle || title).trim();
  const dept = (job.department || (job as PostRecord).dept || 'भर्ती विभाग').trim();
  const qualification = (job.qualificationSummary || (job as PostRecord).qualification || (job as PostRecord).eligibility || 'विज्ञप्ति अनुसार').trim();
  const totalPosts = String(job.totalPosts || 'विज्ञप्ति अनुसार').trim();
  const state = (job.state || 'MP').trim();
  const isTech = Boolean((job as PostRecord).isTechJob || (job as JobPostDetail).isTechJob || job.category === 'Tech/IT');

  const titleLower = `${title} ${shortTitle}`.toLowerCase();
  const deptLower = dept.toLowerCase();

  // If already has custom description saved in Firestore by Admin or Gemini Scraper
  const existingDesc = (job as PostRecord).description || (job as JobPostDetail).description;
  const existingRoleOverview = (job as PostRecord).roleOverview || (job as JobPostDetail).roleOverview;

  // 1. Identify specific job archetype
  const isMpOfficerTO = titleLower.includes('training officer') || titleLower.includes('iti to') || titleLower.includes('प्रशिक्षण अधिकारी') || deptLower.includes('iti') || deptLower.includes('कौशल विकास');
  const isPolice = titleLower.includes('police') || titleLower.includes('constable') || titleLower.includes('आरक्षक') || titleLower.includes('सब इंस्पेक्टर') || titleLower.includes('si') || deptLower.includes('police') || deptLower.includes('गृह विभाग');
  const isSubEng = titleLower.includes('sub engineer') || titleLower.includes('उप यंत्री') || titleLower.includes('junior engineer') || titleLower.includes('je');
  const isCourt = titleLower.includes('high court') || titleLower.includes('district court') || titleLower.includes('stenographer') || titleLower.includes('assistant grade') || titleLower.includes('ag-3') || titleLower.includes('न्यायालय');
  const isPatwari = titleLower.includes('patwari') || titleLower.includes('पटवारी') || titleLower.includes('revenue inspector') || deptLower.includes('भू-अभिलेख');
  const isTeacher = titleLower.includes('teacher') || titleLower.includes('शिक्षक') || titleLower.includes('varg') || titleLower.includes('tet') || titleLower.includes('वर्ग') || deptLower.includes('स्कूल शिक्षा');
  const isRailway = titleLower.includes('railway') || titleLower.includes('rrb') || titleLower.includes('alp') || titleLower.includes('ntpc') || titleLower.includes('रेलवे') || deptLower.includes('railway') || deptLower.includes('रेल');
  const isSsc = titleLower.includes('ssc') || titleLower.includes('cgl') || titleLower.includes('chsl') || titleLower.includes('mts') || titleLower.includes('कर्मचारी चयन आयोग') || deptLower.includes('ssc');
  const isBank = titleLower.includes('bank') || titleLower.includes('ibps') || titleLower.includes('sbi') || titleLower.includes('po') || titleLower.includes('clerk') || titleLower.includes('बैंक') || deptLower.includes('bank') || deptLower.includes('ibps');

  let whatIsThisJob = '';
  let workProfile = '';
  let eligibilityExplanation = '';
  let selectionProcess = '';
  let whyApply = '';
  const basicDocuments: string[] = [];

  if (isMpOfficerTO) {
    whatIsThisJob = `${dept} (MPESB) द्वारा शासकीय औद्योगिक प्रशिक्षण संस्थानों (ITI) में विभिन्न ट्रेडों (इलेक्ट्रीशियन, फिटर, डीजल मैकेनिक, कोपा, वेल्डर आदि) के लिए ट्रेनिंग ऑफिसर (प्रशिक्षण अधिकारी) के ${totalPosts} रिक्त पदों पर नियमित भर्ती हेतु यह विज्ञापन जारी किया गया है। यह मध्य प्रदेश शासन के तकनीकी शिक्षा एवं कौशल विकास विभाग के अंतर्गत एक प्रतिष्ठित राजपत्रित/अराजपत्रित तकनीकी पद है।`;
    
    workProfile = `चयनित ट्रेनिंग ऑफिसर शासकीय ITI में प्रवेशित छात्र-छात्राओं को संबंधित इंजीनियरिंग एवं नॉन-इंजीनियरिंग ट्रेड की सैद्धांतिक (Theory) एवं प्रायोगिक (Practical Workshop) ट्रेनिंग प्रदान करते हैं। इसके अलावा वर्कशॉप मशीनरी का रखरखाव, मासिक एवं वार्षिक स्किल टेस्ट का आयोजन, उद्योग-आधारित इंटर्नशिप मार्गदर्शन तथा राष्ट्रीय कौशल विकास प्रमाणन (NCVT/SCVT) का सुचारू संचालन इनकी मुख्य जिम्मेदारी होती है।`;
    
    eligibilityExplanation = `इस भर्ती हेतु उम्मीदवार के पास न्यूनतम 10वीं/12वीं के साथ संबंधित ट्रेड में NTC/NAC (ITI प्रमाण पत्र) अथवा संबंधित इंजीनियरिंग शाखा (मैकेनिकल/इलेक्ट्रिकल/कंप्यूटर साइंस आदि) में मान्यता प्राप्त 3 वर्षीय पॉलिटेक्निक डिप्लोमा अथवा B.E. / B.Tech की डिग्री होनी अनिवार्य है।`;
    
    basicDocuments.push(
      'आधार कार्ड (सक्रिय मोबाइल नंबर से लिंक - ई-केवाईसी / ओटीपी हेतु)',
      '10वीं की मूल अंकसूची (जन्मतिथि प्रमाण एवं नाम मिलान हेतु)',
      '12वीं की अंकसूची (यदि लागू हो)',
      'संबंधित ट्रेड का ITI / NAC प्रमाण पत्र अथवा पॉलिटेक्निक डिप्लोमा / इंजीनियरिंग डिग्री अंकसूची',
      'मध्य प्रदेश का जीवित रोजगार पंजीयन (MP Rojgar Panjiyan Number)',
      'डिजिटल जाति प्रमाण पत्र (SC / ST / OBC उम्मीदवारों हेतु अनुविभागीय अधिकारी (SDO) द्वारा जारी)',
      'मध्य प्रदेश का डिजिटल मूल निवासी प्रमाण पत्र (Domicile Certificate)',
      'नवीनतम पासपोर्ट साइज रंगीन फोटो (सफेद बैकग्राउंड, नाम व फोटो खिंचवाने की दिनांक सहित)',
      'सफेद कागज पर काली स्याही से किए गए साफ हस्ताक्षर',
      'समग्र आईडी (Samagra ID) एवं आय प्रमाण पत्र (EWS अथवा शुल्क छूट हेतु)'
    );

    selectionProcess = `चयन 100 अंकों की ऑनलाइन कंप्यूटर आधारित परीक्षा (CBT) के आधार पर होगा। परीक्षा में 75 अंक उम्मीदवार के संबंधित ट्रेड/विषय से तथा 25 अंक सामान्य ज्ञान, गणित, रीजनिंग एवं बेसिक कंप्यूटर ज्ञान से पूछे जाएंगे। लिखित परीक्षा के बाद मेरिट लिस्ट, दस्तावेज सत्यापन (DV) एवं मेडिकल परीक्षण होगा।`;

    whyApply = `स्थाई शासकीय नौकरी, 7वें वेतनमान का आकर्षक पे-स्केल (लेवल-8/9), नियमित भत्ते तथा तकनीकी युवाओं को भविष्य के लिए हुनरमंद बनाने का गौरवशाली अवसर।`;
  } else if (isPolice) {
    whatIsThisJob = `${dept} द्वारा राज्य में कानून-व्यवस्था, सुरक्षा एवं तकनीकी संचार प्रणाली को सुदृढ़ करने हेतु आरक्षक (जनरल ड्यूटी एवं रेडियो ऑपरेटर) के कुल ${totalPosts} पदों पर आधिकारिक भर्ती अधिसूचना जारी की गई है। यह युवाओं के लिए पुलिस बल में शामिल होकर प्रदेश सेवा करने का स्वर्णिम अवसर है।`;

    workProfile = `आरक्षक (GD) का मुख्य कार्य संबंधित थानों एवं बटालियन में शांति व्यवस्था बनाए रखना, गश्त एवं वीआईपी सुरक्षा, अपराध अनुसंधान में अधिकारियों का सहयोग तथा यातायात नियंत्रण करना होता है। वहीं रेडियो ऑपरेटर तकनीकी शाखा में वायरलेस संचार, जीपीएस ट्रैकिंग, डेटा ट्रांसमिशन एवं पुलिस कंट्रोल रूम के तकनीकी उपकरणों का संचालन करते हैं।`;

    eligibilityExplanation = `जनरल ड्यूटी (GD) हेतु न्यूनतम 10वीं/12वीं उत्तीर्ण होना आवश्यक है (ST वर्ग हेतु 8वीं उत्तीर्ण भी मान्य)। रेडियो शाखा हेतु 12वीं (गणित/भौतिकी) के साथ इलेक्ट्रॉनिक्स/आईटी/कंप्यूटर में 2 वर्षीय ITI अथवा 3 वर्षीय इंजीनियरिंग डिप्लोमा आवश्यक है। साथ ही निर्धारित शारीरिक मापदंड (लंबाई व सीना) पूरा होना चाहिए।`;

    basicDocuments.push(
      'आधार कार्ड (मोबाइल नंबर व बायोमेट्रिक अपडेटेड)',
      '10वीं एवं 12वीं की मूल अंकसूची',
      'रेडियो शाखा हेतु तकनीकी डिप्लोमा/ITI अंकसूची',
      'मध्य प्रदेश का जीवित रोजगार पंजीयन (Rojgar Panjiyan)',
      'डिजिटल जाति प्रमाण पत्र (SC / ST / OBC / EWS)',
      'मूल निवासी प्रमाण पत्र (MP Domicile)',
      'पासपोर्ट साइज फोटो (स्पष्ट दोनों कान दिखने चाहिए, सफेद बैकग्राउंड)',
      'हस्ताक्षर एवं हस्तलिखित घोषणा पत्र (Declaration)',
      'एनसीसी (NCC) / होमगार्ड / खेल प्रमाण पत्र (यदि बोनस अंकों हेतु लागू हो)'
    );

    selectionProcess = `प्रथम चरण में 100 अंकों की ऑनलाइन परीक्षा (CBT), द्वितीय चरण में शारीरिक दक्षता परीक्षा (PET - 800 मीटर दौड़, गोला फेंक, लंबी कूद) जिसके अंक अंतिम मेरिट में जोड़े जाते हैं, तृतीय चरण में दस्तावेज सत्यापन एवं अंत में मेडिकल टेस्ट।`;

    whyApply = `वर्दी की प्रतिष्ठा, देश सेवा का जज्बा, नियमित सरकारी वेतनमान, वर्दी भत्ता, जोखिम भत्ता एवं पेंशन/सुरक्षा लाभ।`;
  } else if (isSubEng) {
    whatIsThisJob = `${dept} द्वारा विभिन्न निर्माण एवं तकनीकी विभागों (PWD, जल संसाधन, लोक स्वास्थ्य यांत्रिकी, नगरीय प्रशासन) में उप यंत्री / जूनियर इंजीनियर के ${totalPosts} रिक्त पदों पर भर्ती निकाली गई है। यह राज्य शासन में तकनीकी इंजीनियरिंग संवर्ग का महत्वपूर्ण पद है।`;

    workProfile = `उप यंत्री (Civil/Electrical/Mechanical) का कार्य सरकारी बुनियादी ढांचे, सड़कों, पुलों, जल प्रदाय योजनाओं, भवनों एवं सिंचाई परियोजनाओं के निर्माण का तकनीकी सर्वेक्षण करना, साइट पर गुणवत्ता की निगरानी रखना, मापन पुस्तिका (MB Record) तैयार करना तथा ठेकेदारों के बिलों का सत्यापन करना होता है।`;

    eligibilityExplanation = `संबंधित इंजीनियरिंग शाखा (सिविल / इलेक्ट्रिकल / मैकेनिकल) में मान्यता प्राप्त विश्वविद्यालय या बोर्ड से 3 वर्षीय पॉलिटेक्निक डिप्लोमा अथवा बी.ई./बी.टेक डिग्री आवश्यक है।`;

    basicDocuments.push(
      'आधार कार्ड (OTP लिंक)',
      '10वीं/12वीं अंकसूची (जन्मतिथि सत्यापन)',
      'इंजीनियरिंग डिप्लोमा / B.Tech के सभी सेमेस्टर्स की अंकसूची एवं डिग्री',
      'मध्य प्रदेश रोजगार पंजीयन',
      'जाति प्रमाण पत्र एवं मूल निवासी प्रमाण पत्र',
      'पासपोर्ट साइज फोटो एवं हस्ताक्षर'
    );

    selectionProcess = `200 अंकों की संयुक्त ऑनलाइन परीक्षा (CBT) जिसमें 100 अंक सामान्य वर्ग (जीके, हिंदी, अंग्रेजी, गणित, रीजनिंग, कंप्यूटर, विज्ञान) तथा 100 अंक संबंधित इंजीनियरिंग ट्रेड के होते हैं। मेरिट उपरांत दस्तावेज सत्यापन।`;

    whyApply = `कोर इंजीनियरिंग फील्ड में स्थायी सरकारी सेवा, प्रथम श्रेणी निर्माण परियोजनाओं का नेतृत्व एवं क्लास-3 गजेटेड समकक्ष तकनीकी सम्मान।`;
  } else if (isCourt) {
    whatIsThisJob = `${dept} द्वारा उच्च न्यायालय एवं जिला न्यायालयों में शीघ्रलेखक (Stenographer) व सहायक ग्रेड-3 (AG-3) / टाइपिस्ट के ${totalPosts} पदों पर भर्ती का विज्ञापन जारी किया गया है। यह न्यायिक प्रशासन में कार्यालयीन एवं कंप्यूटर संबंधित कार्य का महत्वपूर्ण पद है।`;

    workProfile = `न्यायाधीशों के आदेशों एवं निर्णयों का डिक्टेशन लेकर कंप्यूटर पर शीघ्र टंकण करना, न्यायालयीन फाइलों व मुकदमों की ऑनलाइन एंट्री, पेशी डायरी संधारण तथा पक्षकारों को आदेश की प्रमाणित प्रतिलिपियां जारी करना।`;

    eligibilityExplanation = `किसी भी मान्यता प्राप्त विश्वविद्यालय से स्नातक (Graduation), साथ ही कंप्यूटर प्रोफिशिएंसी सर्टिफिकेशन टेस्ट (MAP-IT CPCT स्कोर कार्ड हिंदी टाइपिंग सहित) तथा शीघ्रलेखक पद हेतु मान्यता प्राप्त बोर्ड से 80/100 शब्द प्रति मिनट का शॉर्टहैंड प्रमाण पत्र अनिवार्य है।`;

    basicDocuments.push(
      'आधार कार्ड',
      '10वीं एवं 12वीं की अंकसूची',
      'स्नातक (Graduation) की डिग्री / अंकसूची',
      'वैध MAP-IT CPCT स्कोर कार्ड (हिंदी टाइपिंग उत्तीर्ण)',
      'शॉर्टहैंड / शीघ्रलेखन प्रमाण पत्र (स्टेनोग्राफर पद हेतु)',
      'जाति व मूल निवासी प्रमाण पत्र',
      'फोटो एवं हस्ताक्षर'
    );

    selectionProcess = `प्रारंभिक ऑनलाइन परीक्षा (Prelims), उसके पश्चात मुख्य परीक्षा में 100 अंकों का कंप्यूटर टाइपिंग व शॉर्टहैंड डिक्टेशन टेस्ट एवं दस्तावेज सत्यापन।`;

    whyApply = `न्यायपालिका में सम्मानजनक कार्य वातावरण, नियमित कोर्ट टाइमिंग, आकर्षक वेतन एवं पदोन्नति के उत्कृष्ट अवसर।`;
  } else if (isPatwari) {
    whatIsThisJob = `${dept} द्वारा राजस्व प्रशासन एवं भू-अभिलेख प्रबंधन हेतु पटवारी के कुल ${totalPosts} पदों पर भर्ती निकाली गई है। यह ग्रामीण एवं कस्बाई विकास की रीढ़ मानी जाने वाली प्रतिष्ठित सेवा है।`;

    workProfile = `गांवों व तहसीलों में भूमि की पैमाइश (नाप), खसरा-खतौनी व नामांतरण का संधारण, गिरदावरी (फसल कटाई रिपोर्ट), आपदा राहत वितरण तथा शासकीय योजनाओं के क्रियान्वयन का जमीनी कार्य।`;

    eligibilityExplanation = `किसी भी मान्यता प्राप्त विश्वविद्यालय से स्नातक (Graduation) उत्तीर्ण। सीपीसीटी (CPCT) स्कोर कार्ड चयन के 3 वर्ष के भीतर प्रस्तुत करने की छूट शासन द्वारा प्रदान की जाती है।`;

    basicDocuments.push(
      'आधार कार्ड (मोबाइल नंबर लिंक)',
      '10वीं/12वीं अंकसूची',
      'स्नातक डिग्री/अंकसूची',
      'मध्य प्रदेश रोजगार पंजीयन',
      'जाति प्रमाण पत्र एवं मूल निवासी प्रमाण पत्र',
      'पासपोर्ट फोटो एवं हस्ताक्षर'
    );

    selectionProcess = `200 अंकों की ऑनलाइन संयुक्त परीक्षा (सामान्य ज्ञान, गणित, सामान्य हिंदी, सामान्य अंग्रेजी, प्रबंधन, कंप्यूटर आदि), मेरिट सूची एवं दस्तावेज सत्यापन।`;

    whyApply = `स्थानीय स्तर पर जनसेवा, मजबूत सामाजिक प्रतिष्ठा, स्थायी शासकीय वेतनमान एवं राजस्व निरीक्षक (RI) व तहसीलदार पद तक पदोन्नति के अवसर।`;
  } else if (isTeacher) {
    whatIsThisJob = `${dept} द्वारा शासकीय विद्यालयों में योग्य शिक्षकों (वर्ग 1, 2, 3 / प्राथमिक, माध्यमिक, उच्च माध्यमिक शिक्षक) के ${totalPosts} रिक्त पदों पर भर्ती प्रक्रिया प्रारंभ की गई है।`;

    workProfile = `छात्रों को आधुनिक पाठ्यक्रम अनुसार शिक्षण प्रदान करना, पाठ योजना तैयार करना, परीक्षा मूल्यांकन, बाल विकास की देखरेख तथा विद्यालयीन प्रशासनिक गतिविधियों का संचालन।`;

    eligibilityExplanation = `संबंधित विषय में स्नातक / परास्नातक के साथ बी.एड. (B.Ed) अथवा डी.एल.एड. (D.El.Ed) एवं शिक्षक पात्रता परीक्षा (TET) उत्तीर्ण होना अनिवार्य।`;

    basicDocuments.push(
      'आधार कार्ड',
      '10वीं/12वीं अंकसूची',
      'स्नातक / परास्नातक अंकसूची',
      'डी.एल.एड. / बी.एड. अंकसूची एवं डिग्री',
      'शिक्षक पात्रता परीक्षा (TET) स्कोर कार्ड',
      'जाति व मूल निवासी प्रमाण पत्र',
      'पासपोर्ट साइज फोटो एवं हस्ताक्षर'
    );

    selectionProcess = `शिक्षक चयन परीक्षा (CST), मेरिट सूची का प्रकाशन, च्वाइस फिलिंग, दस्तावेज सत्यापन एवं स्कूल आवंटन।`;

    whyApply = `राष्ट्र निर्माण में योगदान, गरिमामयी शैक्षणिक जीवन, सम्मानजनक वेतनमान एवं समय पर ग्रीष्मकालीन अवकाश सुविधाएं।`;
  } else if (isRailway) {
    whatIsThisJob = `${dept} (रेलवे भर्ती बोर्ड / RRB) द्वारा भारतीय रेल में ${totalPosts} रिक्तियों के लिए अखिल भारतीय स्तर पर आवेदन आमंत्रित किए गए हैं।`;

    workProfile = `ट्रेन परिचालन, सिग्नल एवं दूरसंचार, ट्रैक अनुरक्षण, रोलिंग स्टॉक मेंटेनेंस तथा स्टेशन प्रबंधन में सक्रिय तकनीकी व परिचालन दायित्वों का निर्वहन।`;

    eligibilityExplanation = `पद की प्रकृति अनुसार 10वीं पास + ITI / संबंधित ट्रेड में अप्रेंटिसशिप अथवा 3 वर्षीय इंजीनियरिंग डिप्लोमा या स्नातक डिग्री।`;

    basicDocuments.push(
      'आधार कार्ड',
      '10वीं बोर्ड अंकसूची (जन्मतिथि सत्यापन)',
      'आईटीआई (ITI) / डिप्लोमा / डिग्री प्रमाण पत्र',
      'केंद्रीय प्रारूप में जाति प्रमाण पत्र (OBC-NCL / SC / ST)',
      'नवीनतम पासपोर्ट फोटो एवं हस्ताक्षर'
    );

    selectionProcess = `कंप्यूटर आधारित टेस्ट (CBT 1 & CBT 2), कंप्यूटर बेस्ड एप्टीट्यूड टेस्ट (CBAT यदि लागू हो), दस्तावेज सत्यापन एवं कड़ा रेलवे मेडिकल परीक्षण (A-1 / B-1 स्टैंडर्ड)।`;

    whyApply = `भारतीय रेलवे में स्थायी सेवा, निःशुल्क रेलवे पास, उत्कृष्ट चिकित्सा सुविधाएं, क्वार्टर सुविधा एवं समयोपरि (Overtime) भत्ते।`;
  } else if (isSsc) {
    whatIsThisJob = `${dept} द्वारा केंद्र सरकार के विभिन्न मंत्रालयों, विभागों एवं संलग्न कार्यालयों में ग्रुप बी और सी के ${totalPosts} पदों पर नियुक्ति हेतु यह भर्ती आयोजित की जा रही है।`;

    workProfile = `केंद्रीय सचिवालय, आयकर, कस्टम, सीबीआई, डाक विभाग में प्रशासनिक फाइलों का संपादन, लेखा परीक्षण (Auditing), कर निर्धारण एवं जनसंपर्क।`;

    eligibilityExplanation = `पद अनुसार 10वीं पास (MTS), 12वीं पास (CHSL) अथवा किसी भी मान्यता प्राप्त विश्वविद्यालय से स्नातक डिग्री (CGL)।`;

    basicDocuments.push(
      'आधार कार्ड',
      '10वीं, 12वीं अथवा स्नातक की अंकसूचियां',
      'केंद्रीय जाति प्रमाण पत्र (Format prescribed by DoPT)',
      'पासपोर्ट साइज रंगीन फोटो (बिना चश्मा व टोपी)',
      'हस्ताक्षर'
    );

    selectionProcess = `टीयर-1 (Tier-I CBT), टीयर-2 (Tier-II CBT), कंप्यूटर प्रोफिशिएंसी व टाइपिंग टेस्ट, दस्तावेज सत्यापन।`;

    whyApply = `भारत सरकार के मंत्रालयों में राजपत्रित/अराजपत्रित सेवा, 7वें वेतन आयोग अनुसार आकर्षक भत्ते, नई दिल्ली व राज्य मुख्यालयों में पोस्टिंग।`;
  } else if (isBank) {
    whatIsThisJob = `${dept} द्वारा सार्वजनिक क्षेत्र के बैंकों में प्रोबेशनरी ऑफिसर (PO) / क्लर्क / स्पेशलिस्ट ऑफिसर के कुल ${totalPosts} रिक्त पदों पर भर्ती प्रक्रिया प्रारंभ की गई है।`;

    workProfile = `ग्राहक सेवा, ऋण स्वीकृति (Loan Processing), खाता संचालन, बैंकिंग ऑपरेशंस, कैश मैनेजमेंट, साइबर सुरक्षा एवं वित्तीय समावेशन।`;

    eligibilityExplanation = `किसी भी विषय में स्नातक डिग्री (Graduation), साथ ही बुनियादी कंप्यूटर संचालन का ज्ञान।`;

    basicDocuments.push(
      'आधार कार्ड एवं पैन कार्ड',
      '10वीं, 12वीं एवं स्नातक की सेमेस्टर-वार अंकसूचियां',
      'जाति प्रमाण पत्र एवं ईडब्ल्यूएस प्रमाण पत्र',
      'पासपोर्ट फोटो, हस्ताक्षर एवं बाएं अंगूठे का निशान (Left Thumb Impression)',
      'हस्तलिखित घोषणा पत्र (Handwritten Declaration)'
    );

    selectionProcess = `प्रारंभिक परीक्षा (Prelims), मुख्य परीक्षा (Mains), वर्णनात्मक अंग्रेजी टेस्ट, साक्षात्कार (PO संवर्ग हेतु) एवं दस्तावेज सत्यापन।`;

    whyApply = `बैंकिंग सेक्टर में तीव्र पदोन्नति, वित्तीय लाभ, बैंक लोन पर विशेष ब्याज छूट एवं सुरक्षित बैंकिंग करियर।`;
  } else if (isTech) {
    whatIsThisJob = `${dept} द्वारा तकनीकी स्नातकों एवं अनुभवी प्रोफेशनल्स हेतु सॉफ्टवेयर / आईटी के विभिन्न पदों पर भर्ती प्रक्रिया प्रारंभ की गई है। यह आधुनिक कॉर्पोरेट वातावरण में नवीनतम तकनीक पर कार्य करने का अवसर प्रदान करता है।`;

    workProfile = `सॉफ्टवेयर डेवलपमेंट, वेब एवं मोबाइल एप्लीकेशन डिजाइनिंग, क्लाउड इंफ्रास्ट्रक्चर प्रबंधन, डेटाबेस ऑप्टिमाइजेशन तथा एजाइल पद्धति के तहत विभिन्न तकनीकी मॉड्यूल्स का निर्माण व टेस्टिंग।`;

    eligibilityExplanation = `B.E./B.Tech (CS/IT/ECE), MCA, M.Sc (IT) अथवा संबंधित तकनीकी स्ट्रीम में डिग्री। संबंधित प्रोग्रामिंग लैंग्वेज एवं तकनीकी टूल्स का व्यावहारिक ज्ञान।`;

    basicDocuments.push(
      'अपडेटेड प्रोफेशनल बायोडाटा / रिज्यूमे (Resume/CV)',
      '10वीं, 12वीं एवं स्नातक/परास्नातक की सभी सेमेस्टर्स की अंकसूचियां',
      'आधार कार्ड एवं पैन कार्ड (पहचान व कर सत्यापन हेतु)',
      'पासपोर्ट साइज प्रोफेशनल फोटो',
      'अनुभव प्रमाण पत्र एवं पिछले संस्थान की पे-स्लिप (यदि अनुभवी हों)',
      'गिटहब (GitHub) / लिंक्डइन (LinkedIn) प्रोफाइल एवं प्रोजेक्ट पोर्टफोलियो'
    );

    selectionProcess = `ऑनलाइन कोडिंग टेस्ट / तकनीकी असेसमेंट, तकनीकी साक्षात्कार (Technical Round), मैनेजिरियल राउंड तथा एचआर राउंड।`;

    whyApply = `उच्चतम सीटीसी पैकेज, फ्लेक्सिबल वर्क कल्चर, आधुनिक टेक्नोलॉजी सीखने का मौका तथा वैश्विक करियर ग्रोथ।`;
  } else {
    whatIsThisJob = `${dept} द्वारा योग्य एवं इच्छुक भारतीय नागरिकों से विभिन्न संवर्गों में कुल ${totalPosts} रिक्त पदों पर भर्ती हेतु ऑनलाइन आवेदन आमंत्रित किए गए हैं। यह भर्ती शासकीय नियमों के तहत विज्ञापित की गई है।`;

    workProfile = `चयनित उम्मीदवारों को विभाग के अंतर्गत प्रशासनिक कार्य, जनसेवा, क्षेत्रीय निरीक्षण, रिकॉर्ड संधारण एवं शासकीय योजनाओं के सफल क्रियान्वयन की जिम्मेदारी सौंपी जाएगी। कार्य का स्वरूप पद की प्रकृति अनुसार कार्यालयीन अथवा मैदानी होगा।`;

    eligibilityExplanation = `इस भर्ती में आवेदन करने हेतु उम्मीदवार के पास न्यूनतम योग्यता "${qualification}" होना आवश्यक है। आयु सीमा एवं आरक्षण का लाभ संबंधित राज्य/केंद्र सरकार के नियमों अनुसार देय होगा।`;

    basicDocuments.push(
      'आधार कार्ड (मोबाइल नंबर लिंक होना अनिवार्य है)',
      '10वीं बोर्ड अंकसूची (जन्मतिथि सत्यापन हेतु)',
      '12वीं अथवा स्नातक / डिप्लोमा अंकसूची (पद की पात्रता अनुसार)',
      state === 'MP' ? 'मध्य प्रदेश का जीवित रोजगार पंजीयन (MP Rojgar Panjiyan)' : 'पहचान पत्र (वोटर आईडी/पैन कार्ड/ड्राइविंग लाइसेंस)',
      'डिजिटल जाति प्रमाण पत्र (आरक्षित वर्ग हेतु)',
      'मूल निवासी प्रमाण पत्र (स्थानीय आरक्षण लाभ हेतु)',
      'नवीनतम पासपोर्ट साइज रंगीन फोटो (साफ पृष्ठभूमि)',
      'उम्मीदवार के हस्ताक्षर'
    );

    selectionProcess = `ऑनलाइन कंप्यूटर आधारित लिखित परीक्षा (CBT), पद अनुसार कौशल/ट्रेड/शारीरिक परीक्षण, मेरिट सूची का प्रकाशन एवं दस्तावेज सत्यापन।`;

    whyApply = `स्थायी सरकारी नौकरी, समय पर वेतन भुगतान, भविष्य की सुरक्षा, सामाजिक मान-सम्मान एवं जनहित में कार्य करने का अवसर।`;
  }

  // If existingDesc exists, blend it
  const intro = existingDesc
    ? existingDesc
    : whatIsThisJob;

  const aboutParagraphs = existingDesc
    ? existingDesc
        .split(/\n\n+/)
        .map((p) => p.trim())
        .filter(Boolean)
    : [whatIsThisJob];

  // Derive selection stages intelligently
  const selectionStages: string[] = [];
  if (isPolice) {
    selectionStages.push('ऑनलाइन लिखित परीक्षा (CBT)', 'शारीरिक दक्षता परीक्षण (PET/PST)', 'दस्तावेज सत्यापन (DV)', 'मेडिकल परीक्षण (Medical)');
  } else if (isCourt) {
    selectionStages.push('प्रारंभिक लिखित परीक्षा', 'शॉर्टहैंड / टाइपिंग दक्षता परीक्षा', 'दस्तावेज सत्यापन');
  } else if (isTech) {
    selectionStages.push('ऑनलाइन कोडिंग व एप्टीट्यूड टेस्ट', 'तकनीकी साक्षात्कार (Technical Interview)', 'एचआर राउंड (HR)');
  } else if (isMpOfficerTO) {
    selectionStages.push('100 अंकों की ऑनलाइन परीक्षा (ट्रेड + सामान्य)', 'मेरिट सूची प्रकाशन', 'दस्तावेज सत्यापन');
  } else if (isSubEng) {
    selectionStages.push('ऑनलाइन संयुक्त परीक्षा (CBT - 200 अंक)', 'मेरिट सूची सत्यापन', 'दस्तावेज एवं पद स्थापना');
  } else if (isPatwari) {
    selectionStages.push('ऑनलाइन संयुक्त परीक्षा (CBT)', 'मेरिट सूची एवं जिला आवंटन', 'दस्तावेज सत्यापन');
  } else if (isTeacher) {
    selectionStages.push('पात्रता परीक्षा (TET)', 'चयन परीक्षा (Selection Test)', 'दस्तावेज सत्यापन एवं काउंसिलिंग');
  } else if (isRailway) {
    selectionStages.push('कंप्यूटर आधारित परीक्षा (CBT 1 & 2)', 'कौशल / साइको टेस्ट (यदि लागू हो)', 'दस्तावेज सत्यापन एवं मेडिकल');
  } else if (isSsc) {
    selectionStages.push('टियर-1 ऑनलाइन परीक्षा', 'टियर-2 मुख्य परीक्षा', 'दस्तावेज सत्यापन');
  } else if (isBank) {
    selectionStages.push('ऑनलाइन प्रारंभिक परीक्षा (Prelims)', 'ऑनलाइन मुख्य परीक्षा (Mains)', 'साक्षात्कार / दस्तावेज सत्यापन');
  } else {
    selectionStages.push('ऑनलाइन / लिखित परीक्षा (CBT)', 'दस्तावेज सत्यापन (Document Verification)', 'अंतिम चयन सूची (Final Merit)');
  }

  const fullMarkdown = `
### 📌 यह भर्ती क्या है और इसका उद्देश्य क्या है?
${existingDesc || whatIsThisJob}

### 💼 चयनित होने पर क्या कार्य करना होगा? (Work Profile & Duties)
${existingRoleOverview || workProfile}

### 🎓 शैक्षणिक योग्यता एवं पात्रता का सरल विवरण
${eligibilityExplanation}

### 📑 ऑनलाइन आवेदन करने हेतु आवश्यक बेसिक दस्तावेज (Documents Checklist)
फॉर्म भरने से पूर्व उम्मीदवार निम्नलिखित दस्तावेजों की मूल व डिजिटल प्रति अवश्य तैयार रखें:
${basicDocuments.map((d, i) => `${i + 1}. **${d}**`).join('\n')}

### 🎯 चयन प्रक्रिया (Selection Process & Examination Pattern)
${selectionProcess}

### 💡 NP Job Portal विशेष सलाह (घर बैठे 100% सुरक्षित फॉर्म सुविधा)
> सरकारी नौकरी का फॉर्म भरते समय नाम, जन्मतिथि, वर्ग या दस्तावेज अपलोड में छोटी सी त्रुटि होने पर फॉर्म रिजेक्ट हो सकता है। यदि आप बिना किसी गलती के घर बैठे अधिकृत कंप्यूटर रसीद के साथ फॉर्म भरवाना चाहते हैं, तो **Nitish Khobragade (8982324497)** से व्हाट्सएप पर संपर्क कर सकते हैं।
  `.trim();

  return {
    intro,
    whatIsThisJob,
    workProfile: existingRoleOverview || workProfile,
    eligibilityExplanation,
    basicDocuments,
    selectionProcess,
    whyApply,
    fullMarkdown,
    aboutParagraphs: aboutParagraphs.length > 0 ? aboutParagraphs : [whatIsThisJob],
    selectionStages
  };
}
