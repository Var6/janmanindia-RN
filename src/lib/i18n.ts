import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

/** Supported UI locales. We pick the language code only (`en`, `hi`, `mr`)
 *  off the device locale. Adding a new language = add it here, then add
 *  the matching key bundle below. */
export type Locale = 'en' | 'hi' | 'mr';
const SUPPORTED: Locale[] = ['en', 'hi', 'mr'];
const STORAGE_KEY = 'janmanindia.locale';

let activeLocale: Locale = 'en';
let overrideLocale: Locale | null = null;
const listeners = new Set<() => void>();

const STRINGS: Record<Locale, Record<string, string>> = {
  en: {
    // Generic
    cancel: 'Cancel',
    save: 'Save',
    send: 'Send',
    submit: 'Submit',
    sending: 'Sending…',
    loading: 'Loading…',
    failed: 'Failed',
    networkError: 'Network error',
    discard: 'Discard',
    signOut: 'Sign out',
    signOutConfirm: "You'll need your email and password to sign back in.",
    signOutQ: 'Sign out?',
    yes: 'Yes',
    no: 'No',
    today: 'Today',
    tomorrow: 'Tomorrow',
    language: 'Language',
    selectLanguage: 'Choose your language',

    // Login
    login_title: 'Janmanindia',
    login_subtitle: 'Community login',
    login_email: 'Email',
    login_password: 'Password',
    login_signin: 'Sign in',
    login_noAccount: "Don't have an account?",
    login_noAccountInfo: 'Register at app.janmanindia.org/register, then log in here.',
    login_noAccountTitle: 'No account?',
    login_communityOnly: 'This app is for community members only.',
    login_failed: 'Login failed',

    // Dashboard
    dash_hi: 'Hi',
    dash_help: 'What do you need help with today?',
    dash_caseTracker: 'Case Tracker',
    dash_caseTracker_sub: 'See where your cases stand',
    dash_speak: 'Speak to Us',
    dash_speak_sub: 'Send a voice or text message',
    dash_sos: 'Emergency SOS',
    dash_sos_sub: 'Send an urgent alert',
    dash_apts: 'Appointments',
    dash_apts_sub: 'Request a meeting',
    dash_file: 'File a Case',
    dash_file_sub: 'Start a new intake form',
    dash_myCases: 'My Cases',
    dash_recentApts: 'Recent Appointments',
    dash_noCases: 'No cases yet — your social worker will register one for you when needed.',
    dash_noApts: 'No appointments yet.',
    dash_nextHearing: 'Next hearing',

    // Case Tracker
    track_title: 'My Cases',
    track_count_one: 'case',
    track_count_other: 'cases',
    track_criminal: 'Criminal',
    track_highcourt: 'High Court',

    // Case Detail
    detail_history: 'Case History',
    detail_documents: 'Documents',
    detail_diary: 'Case Diary',
    detail_court: 'Court',
    detail_status: 'Status',
    detail_next: 'Next',
    detail_notFound: 'Not found',

    // Appointments
    apts_title: 'Appointments',
    apts_book: '+ Book',
    apts_count_one: 'request',
    apts_count_other: 'requests',
    apts_with: 'With',
    apts_empty: 'No appointments yet — tap +Book to request a meeting with your social worker.',
    book_title: 'Book an appointment',
    book_loadingSw: 'Loading social worker…',
    book_reason: 'Reason',
    book_reasonPh: 'What do you want to discuss?',
    book_date: 'Date (YYYY-MM-DD)',
    book_time: 'Time (HH:MM, 24-hour)',
    book_send: 'Send request',
    book_missing: 'Missing info',
    book_missingMsg: 'Please fill in reason, date and time.',
    book_invalidDate: 'Invalid date',
    book_invalidDateMsg: 'Use date YYYY-MM-DD and time HH:MM (24h).',
    book_noSw: 'No social worker',
    book_noSwMsg: "You don't have an assigned social worker yet.",
    book_failed: 'Could not book.',

    // File Case
    file_title: 'File a case',
    file_subtitle: 'Tell us what happened. A social worker will get in touch within 24 hours.',
    file_caseTitle: 'Short case title *',
    file_caseTitlePh: 'e.g. Domestic violence at Patel Nagar',
    file_type: 'Type *',
    file_filerName: 'Your name *',
    file_filerNamePh: 'Full name',
    file_filerPhone: 'Your phone',
    file_filerPhonePh: '10-digit number',
    file_victim: "Victim's name (if different)",
    file_issues: 'Issues (comma-separated)',
    file_issuesPh: 'e.g. Domestic violence, Property dispute',
    file_accused: 'Accused name(s)',
    file_facts: 'Facts of the case *',
    file_factsPh: 'Describe what happened in your own words',
    file_fir: 'FIR number (if filed)',
    file_police: 'Police station',
    file_place: 'Place of occurrence',
    file_done: 'Submitted',
    file_doneMsg: 'Your social worker will review and reach out shortly.',
    file_missing: 'Missing info',
    file_missingMsg: 'Please fill in case title, your name, and the facts of the case.',

    // Speak To Us
    speak_title: 'Speak to us',
    speak_subtitle: "Type your message, or record your voice if you'd rather speak.",
    speak_message: 'Message',
    speak_messagePh: 'What would you like to tell us?',
    speak_voice: 'Voice note',
    speak_recorded: 'Recorded',
    speak_record: '🎤  Tap to record',
    speak_stop: '⏹  Stop recording',
    speak_done: 'Message sent',
    speak_doneMsg: 'Your social worker will listen and get back to you soon.',
    speak_empty: 'Empty message',
    speak_emptyMsg: 'Type a message or record a voice note.',
    speak_perm: 'Permission needed',
    speak_permMsg: 'Please allow microphone access.',
    speak_uploadFailed: 'Could not upload voice note.',

    // SOS
    sos_title: '🚨 Emergency SOS',
    sos_warn: 'For ongoing crimes or active danger only. Misuse may delay help for genuine emergencies.',
    sos_what: "What's happening *",
    sos_whatPh: 'e.g. Being threatened at home, assault in progress…',
    sos_where: 'Where are you?',
    sos_wherePh: 'Address or landmark',
    sos_send: 'Send alert',
    sos_confirm: 'Send emergency alert?',
    sos_confirmMsg: 'This sends an immediate alert to your social worker. Use only for active danger or ongoing crime.',
    sos_done: 'Alert sent',
    sos_doneMsg: 'Your social worker has been notified. They will reach out shortly.',
    sos_doneCall: 'For immediate danger, also call 100 (police) or 112 (national emergency).',
    sos_helpline: 'Police: 100   ·   National emergency: 112   ·   Women helpline: 1091',
    sos_emptyTitle: 'Tell us what is happening',
    sos_emptyMsg: 'Please describe the emergency briefly.',

    // Profile
    profile_title: 'Profile',
    profile_name: 'Name',
    profile_email: 'Email',
    profile_phone: 'Phone',
    profile_verification: 'Verification',
  },
  hi: {
    cancel: 'रद्द करें',
    save: 'सहेजें',
    send: 'भेजें',
    submit: 'जमा करें',
    sending: 'भेजा जा रहा है…',
    loading: 'लोड हो रहा है…',
    failed: 'विफल',
    networkError: 'नेटवर्क त्रुटि',
    discard: 'हटाएं',
    signOut: 'साइन आउट',
    signOutConfirm: 'दोबारा साइन इन करने के लिए ईमेल और पासवर्ड चाहिए होगा।',
    signOutQ: 'साइन आउट करें?',
    yes: 'हाँ',
    no: 'नहीं',
    today: 'आज',
    tomorrow: 'कल',
    language: 'भाषा',
    selectLanguage: 'अपनी भाषा चुनें',

    login_title: 'जनमान इंडिया',
    login_subtitle: 'समुदाय लॉगिन',
    login_email: 'ईमेल',
    login_password: 'पासवर्ड',
    login_signin: 'साइन इन करें',
    login_noAccount: 'क्या आपका अकाउंट नहीं है?',
    login_noAccountInfo: 'app.janmanindia.org/register पर रजिस्टर करें, फिर यहाँ लॉगिन करें।',
    login_noAccountTitle: 'अकाउंट नहीं है?',
    login_communityOnly: 'यह ऐप केवल समुदाय के सदस्यों के लिए है।',
    login_failed: 'लॉगिन विफल',

    dash_hi: 'नमस्ते',
    dash_help: 'आज आपको किस मदद की ज़रूरत है?',
    dash_caseTracker: 'केस ट्रैकर',
    dash_caseTracker_sub: 'अपने केस की स्थिति देखें',
    dash_speak: 'हमसे बात करें',
    dash_speak_sub: 'आवाज़ या टेक्स्ट संदेश भेजें',
    dash_sos: 'आपातकालीन SOS',
    dash_sos_sub: 'तुरंत अलर्ट भेजें',
    dash_apts: 'अपॉइंटमेंट',
    dash_apts_sub: 'मीटिंग का अनुरोध करें',
    dash_file: 'केस दर्ज करें',
    dash_file_sub: 'नया फॉर्म भरें',
    dash_myCases: 'मेरे केस',
    dash_recentApts: 'हाल की अपॉइंटमेंट',
    dash_noCases: 'अभी कोई केस नहीं है — ज़रूरत पड़ने पर आपके सोशल वर्कर इसे दर्ज करेंगे।',
    dash_noApts: 'अभी कोई अपॉइंटमेंट नहीं है।',
    dash_nextHearing: 'अगली सुनवाई',

    track_title: 'मेरे केस',
    track_count_one: 'केस',
    track_count_other: 'केस',
    track_criminal: 'आपराधिक',
    track_highcourt: 'उच्च न्यायालय',

    detail_history: 'केस का इतिहास',
    detail_documents: 'दस्तावेज़',
    detail_diary: 'केस डायरी',
    detail_court: 'न्यायालय',
    detail_status: 'स्थिति',
    detail_next: 'अगला',
    detail_notFound: 'नहीं मिला',

    apts_title: 'अपॉइंटमेंट',
    apts_book: '+ बुक करें',
    apts_count_one: 'अनुरोध',
    apts_count_other: 'अनुरोध',
    apts_with: 'के साथ',
    apts_empty: 'अभी कोई अपॉइंटमेंट नहीं है — सोशल वर्कर के साथ मीटिंग के लिए +बुक करें दबाएँ।',
    book_title: 'अपॉइंटमेंट बुक करें',
    book_loadingSw: 'सोशल वर्कर लोड हो रहा है…',
    book_reason: 'कारण',
    book_reasonPh: 'आप क्या बात करना चाहते हैं?',
    book_date: 'दिनांक (YYYY-MM-DD)',
    book_time: 'समय (HH:MM, 24-घंटे)',
    book_send: 'अनुरोध भेजें',
    book_missing: 'जानकारी अधूरी है',
    book_missingMsg: 'कृपया कारण, दिनांक और समय भरें।',
    book_invalidDate: 'दिनांक गलत है',
    book_invalidDateMsg: 'दिनांक YYYY-MM-DD और समय HH:MM (24h) फॉर्मेट में दें।',
    book_noSw: 'सोशल वर्कर नहीं है',
    book_noSwMsg: 'आपको अभी तक कोई सोशल वर्कर नहीं सौंपा गया है।',
    book_failed: 'बुक नहीं हो सका।',

    file_title: 'केस दर्ज करें',
    file_subtitle: 'हमें बताएँ क्या हुआ। 24 घंटे के अंदर सोशल वर्कर संपर्क करेंगे।',
    file_caseTitle: 'केस का संक्षिप्त शीर्षक *',
    file_caseTitlePh: 'जैसे: पटेल नगर में घरेलू हिंसा',
    file_type: 'प्रकार *',
    file_filerName: 'आपका नाम *',
    file_filerNamePh: 'पूरा नाम',
    file_filerPhone: 'आपका फ़ोन',
    file_filerPhonePh: '10-अंकों का नंबर',
    file_victim: 'पीड़ित का नाम (यदि अलग है)',
    file_issues: 'मुद्दे (कॉमा से अलग करें)',
    file_issuesPh: 'जैसे: घरेलू हिंसा, संपत्ति विवाद',
    file_accused: 'आरोपी का नाम',
    file_facts: 'घटना का विवरण *',
    file_factsPh: 'अपने शब्दों में बताएँ क्या हुआ',
    file_fir: 'FIR नंबर (यदि दर्ज है)',
    file_police: 'थाना',
    file_place: 'घटना स्थल',
    file_done: 'जमा हो गया',
    file_doneMsg: 'आपके सोशल वर्कर समीक्षा करके जल्द संपर्क करेंगे।',
    file_missing: 'जानकारी अधूरी है',
    file_missingMsg: 'कृपया केस का शीर्षक, अपना नाम और घटना का विवरण भरें।',

    speak_title: 'हमसे बात करें',
    speak_subtitle: 'अपना संदेश लिखें, या यदि आप बोलना पसंद करते हैं तो अपनी आवाज़ रिकॉर्ड करें।',
    speak_message: 'संदेश',
    speak_messagePh: 'आप हमें क्या बताना चाहते हैं?',
    speak_voice: 'वॉयस नोट',
    speak_recorded: 'रिकॉर्ड हो गया',
    speak_record: '🎤  रिकॉर्ड करने के लिए दबाएँ',
    speak_stop: '⏹  रिकॉर्डिंग रोकें',
    speak_done: 'संदेश भेज दिया गया',
    speak_doneMsg: 'आपके सोशल वर्कर सुनेंगे और जल्द जवाब देंगे।',
    speak_empty: 'संदेश खाली है',
    speak_emptyMsg: 'संदेश लिखें या वॉयस नोट रिकॉर्ड करें।',
    speak_perm: 'अनुमति चाहिए',
    speak_permMsg: 'कृपया माइक्रोफ़ोन की अनुमति दें।',
    speak_uploadFailed: 'वॉयस नोट अपलोड नहीं हो सका।',

    sos_title: '🚨 आपातकालीन SOS',
    sos_warn: 'केवल चल रहे अपराध या सक्रिय खतरे के लिए। दुरुपयोग से असली आपात स्थिति में देरी हो सकती है।',
    sos_what: 'क्या हो रहा है? *',
    sos_whatPh: 'जैसे: घर में धमकी मिल रही है, हमला हो रहा है…',
    sos_where: 'आप कहाँ हैं?',
    sos_wherePh: 'पता या निशानी',
    sos_send: 'अलर्ट भेजें',
    sos_confirm: 'आपातकालीन अलर्ट भेजें?',
    sos_confirmMsg: 'यह आपके सोशल वर्कर को तुरंत अलर्ट भेजेगा। केवल सक्रिय खतरे या अपराध के लिए उपयोग करें।',
    sos_done: 'अलर्ट भेज दिया गया',
    sos_doneMsg: 'आपके सोशल वर्कर को सूचित कर दिया गया है। वे जल्द संपर्क करेंगे।',
    sos_doneCall: 'तत्काल खतरे के लिए 100 (पुलिस) या 112 (राष्ट्रीय आपात) भी कॉल करें।',
    sos_helpline: 'पुलिस: 100   ·   राष्ट्रीय आपात: 112   ·   महिला हेल्पलाइन: 1091',
    sos_emptyTitle: 'बताएँ क्या हो रहा है',
    sos_emptyMsg: 'कृपया आपात स्थिति का संक्षिप्त विवरण दें।',

    profile_title: 'प्रोफ़ाइल',
    profile_name: 'नाम',
    profile_email: 'ईमेल',
    profile_phone: 'फ़ोन',
    profile_verification: 'सत्यापन',
  },
  mr: {
    cancel: 'रद्द करा',
    save: 'जतन करा',
    send: 'पाठवा',
    submit: 'सादर करा',
    sending: 'पाठवत आहे…',
    loading: 'लोड होत आहे…',
    failed: 'अयशस्वी',
    networkError: 'नेटवर्क त्रुटी',
    discard: 'टाकून द्या',
    signOut: 'साइन आउट',
    signOutConfirm: 'पुन्हा साइन इन करण्यासाठी ईमेल आणि पासवर्ड लागेल.',
    signOutQ: 'साइन आउट करायचे?',
    yes: 'होय',
    no: 'नाही',
    today: 'आज',
    tomorrow: 'उद्या',
    language: 'भाषा',
    selectLanguage: 'तुमची भाषा निवडा',

    login_title: 'जनमान इंडिया',
    login_subtitle: 'समुदाय लॉगिन',
    login_email: 'ईमेल',
    login_password: 'पासवर्ड',
    login_signin: 'साइन इन करा',
    login_noAccount: 'खाते नाही का?',
    login_noAccountInfo: 'app.janmanindia.org/register वर नोंदणी करा, नंतर येथे लॉगिन करा.',
    login_noAccountTitle: 'खाते नाही?',
    login_communityOnly: 'हा अ‍ॅप फक्त समुदाय सदस्यांसाठी आहे.',
    login_failed: 'लॉगिन अयशस्वी',

    dash_hi: 'नमस्कार',
    dash_help: 'आज तुम्हाला कशाची मदत हवी आहे?',
    dash_caseTracker: 'केस ट्रॅकर',
    dash_caseTracker_sub: 'तुमच्या केसची स्थिती पाहा',
    dash_speak: 'आमच्याशी बोला',
    dash_speak_sub: 'आवाज किंवा मजकूर संदेश पाठवा',
    dash_sos: 'आणीबाणी SOS',
    dash_sos_sub: 'तातडीचा अलर्ट पाठवा',
    dash_apts: 'अपॉइंटमेंट',
    dash_apts_sub: 'मीटिंगसाठी विनंती करा',
    dash_file: 'केस दाखल करा',
    dash_file_sub: 'नवीन फॉर्म भरा',
    dash_myCases: 'माझे केस',
    dash_recentApts: 'अलीकडील अपॉइंटमेंट',
    dash_noCases: 'अद्याप कोणताही केस नाही — गरजेनुसार तुमचे सामाजिक कार्यकर्ते दाखल करतील.',
    dash_noApts: 'अद्याप कोणतीही अपॉइंटमेंट नाही.',
    dash_nextHearing: 'पुढील सुनावणी',

    track_title: 'माझे केस',
    track_count_one: 'केस',
    track_count_other: 'केस',
    track_criminal: 'फौजदारी',
    track_highcourt: 'उच्च न्यायालय',

    detail_history: 'केस इतिहास',
    detail_documents: 'कागदपत्रे',
    detail_diary: 'केस डायरी',
    detail_court: 'न्यायालय',
    detail_status: 'स्थिती',
    detail_next: 'पुढील',
    detail_notFound: 'सापडले नाही',

    apts_title: 'अपॉइंटमेंट',
    apts_book: '+ बुक करा',
    apts_count_one: 'विनंती',
    apts_count_other: 'विनंत्या',
    apts_with: 'सोबत',
    apts_empty: 'अद्याप कोणतीही अपॉइंटमेंट नाही — सामाजिक कार्यकर्त्यासोबत मीटिंगसाठी +बुक करा दाबा.',
    book_title: 'अपॉइंटमेंट बुक करा',
    book_loadingSw: 'सामाजिक कार्यकर्ता लोड होत आहे…',
    book_reason: 'कारण',
    book_reasonPh: 'तुम्हाला कशाबद्दल बोलायचे आहे?',
    book_date: 'दिनांक (YYYY-MM-DD)',
    book_time: 'वेळ (HH:MM, 24-तास)',
    book_send: 'विनंती पाठवा',
    book_missing: 'माहिती अपूर्ण आहे',
    book_missingMsg: 'कृपया कारण, दिनांक आणि वेळ भरा.',
    book_invalidDate: 'चुकीची तारीख',
    book_invalidDateMsg: 'दिनांक YYYY-MM-DD आणि वेळ HH:MM (24h) मध्ये द्या.',
    book_noSw: 'सामाजिक कार्यकर्ता नाही',
    book_noSwMsg: 'तुम्हाला अद्याप कोणीही सामाजिक कार्यकर्ता नियुक्त केलेला नाही.',
    book_failed: 'बुक करता आले नाही.',

    file_title: 'केस दाखल करा',
    file_subtitle: 'काय झाले ते सांगा. 24 तासांत सामाजिक कार्यकर्ते संपर्क करतील.',
    file_caseTitle: 'केसचे लहान शीर्षक *',
    file_caseTitlePh: 'उदा. पटेल नगर मध्ये घरगुती हिंसा',
    file_type: 'प्रकार *',
    file_filerName: 'तुमचे नाव *',
    file_filerNamePh: 'पूर्ण नाव',
    file_filerPhone: 'तुमचा फोन',
    file_filerPhonePh: '10-अंकी नंबर',
    file_victim: 'पीडितेचे नाव (वेगळे असल्यास)',
    file_issues: 'मुद्दे (कॉमा वापरून)',
    file_issuesPh: 'उदा. घरगुती हिंसा, मालमत्ता वाद',
    file_accused: 'आरोपीचे नाव',
    file_facts: 'घटनेचे विवरण *',
    file_factsPh: 'तुमच्या शब्दांत काय झाले ते सांगा',
    file_fir: 'FIR क्रमांक (दाखल असल्यास)',
    file_police: 'पोलिस ठाणे',
    file_place: 'घटनास्थळ',
    file_done: 'सादर केले',
    file_doneMsg: 'तुमचे सामाजिक कार्यकर्ते लवकरच पुनरावलोकन करून संपर्क करतील.',
    file_missing: 'माहिती अपूर्ण आहे',
    file_missingMsg: 'कृपया केस शीर्षक, तुमचे नाव आणि घटनेचे विवरण भरा.',

    speak_title: 'आमच्याशी बोला',
    speak_subtitle: 'तुमचा संदेश टाइप करा, किंवा बोलणे पसंत असल्यास तुमचा आवाज रेकॉर्ड करा.',
    speak_message: 'संदेश',
    speak_messagePh: 'तुम्हाला आम्हाला काय सांगायचे आहे?',
    speak_voice: 'व्हॉइस नोट',
    speak_recorded: 'रेकॉर्ड केले',
    speak_record: '🎤  रेकॉर्ड करण्यासाठी दाबा',
    speak_stop: '⏹  रेकॉर्डिंग थांबवा',
    speak_done: 'संदेश पाठवला',
    speak_doneMsg: 'तुमचे सामाजिक कार्यकर्ते ऐकून लवकर उत्तर देतील.',
    speak_empty: 'संदेश रिकामा आहे',
    speak_emptyMsg: 'संदेश टाइप करा किंवा व्हॉइस नोट रेकॉर्ड करा.',
    speak_perm: 'परवानगी आवश्यक',
    speak_permMsg: 'कृपया मायक्रोफोनला परवानगी द्या.',
    speak_uploadFailed: 'व्हॉइस नोट अपलोड करता आला नाही.',

    sos_title: '🚨 आणीबाणी SOS',
    sos_warn: 'फक्त सुरू असलेल्या गुन्ह्यांसाठी किंवा सक्रिय धोक्यासाठी. गैरवापरामुळे खऱ्या आणीबाणीत मदतीला उशीर होऊ शकतो.',
    sos_what: 'काय होत आहे? *',
    sos_whatPh: 'उदा. घरात धमकी मिळत आहे, हल्ला सुरू आहे…',
    sos_where: 'तुम्ही कुठे आहात?',
    sos_wherePh: 'पत्ता किंवा खूण',
    sos_send: 'अलर्ट पाठवा',
    sos_confirm: 'आणीबाणी अलर्ट पाठवायचा?',
    sos_confirmMsg: 'हे तुमच्या सामाजिक कार्यकर्त्याला त्वरित अलर्ट पाठवते. फक्त सक्रिय धोका किंवा गुन्ह्यासाठी वापरा.',
    sos_done: 'अलर्ट पाठवला',
    sos_doneMsg: 'तुमच्या सामाजिक कार्यकर्त्याला सूचित केले आहे. ते लवकरच संपर्क करतील.',
    sos_doneCall: 'तत्काळ धोक्यासाठी 100 (पोलिस) किंवा 112 (राष्ट्रीय आणीबाणी) देखील कॉल करा.',
    sos_helpline: 'पोलिस: 100   ·   राष्ट्रीय आणीबाणी: 112   ·   महिला हेल्पलाइन: 1091',
    sos_emptyTitle: 'काय होत आहे ते सांगा',
    sos_emptyMsg: 'कृपया आणीबाणीचे थोडक्यात विवरण द्या.',

    profile_title: 'प्रोफाइल',
    profile_name: 'नाव',
    profile_email: 'ईमेल',
    profile_phone: 'फोन',
    profile_verification: 'पडताळणी',
  },
};

function detectLocale(): Locale {
  const tag = (Localization.getLocales?.()[0]?.languageCode ?? 'en').toLowerCase();
  return (SUPPORTED.includes(tag as Locale) ? tag : 'en') as Locale;
}

/** Initialise from device + persisted override. Call once at app boot
 *  before any rendering that uses t(). */
export async function initLocale(): Promise<Locale> {
  const stored = (await AsyncStorage.getItem(STORAGE_KEY)) as Locale | null;
  if (stored && SUPPORTED.includes(stored)) {
    overrideLocale = stored;
    activeLocale = stored;
  } else {
    activeLocale = detectLocale();
  }
  return activeLocale;
}

export function getLocale(): Locale { return activeLocale; }
export function getSupportedLocales(): Locale[] { return [...SUPPORTED]; }

export const LOCALE_NAMES: Record<Locale, string> = {
  en: 'English',
  hi: 'हिन्दी',
  mr: 'मराठी',
};

/** Persist the user's choice. Pass `null` to reset to device default. */
export async function setLocale(loc: Locale | null): Promise<void> {
  if (loc === null) {
    overrideLocale = null;
    await AsyncStorage.removeItem(STORAGE_KEY);
    activeLocale = detectLocale();
  } else {
    overrideLocale = loc;
    await AsyncStorage.setItem(STORAGE_KEY, loc);
    activeLocale = loc;
  }
  for (const fn of listeners) fn();
}

/** Subscribe to locale changes — used by the React hook. */
export function onLocaleChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

/** Translate a key. Falls back to English then to the key itself. */
export function t(key: string): string {
  return STRINGS[activeLocale]?.[key] ?? STRINGS.en[key] ?? key;
}
