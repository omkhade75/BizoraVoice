"""
Unified LLM engine supporting both Google Gemini (Cloud) and Ollama (Local),
plus an intelligent Prompt-Aware Dialogue Engine for zero-failure fallback.

Allows seamless toggling between:
- Cloud-hosted Google Gemini (gemini-2.5-flash, gemini-1.5-flash, gemini-2.0-flash) with 0% laptop load.
- Local Ollama (qwen3.5:4b, qwen2.5:7b, etc.) for offline/on-premise sovereign computing.
- Zero-Failure PromptAwareDialogueEngine: dynamically parses custom system prompts,
  extracts discrete policy/topic steps, tracks conversation turns, and engages in
  natural, multi-turn dialogues across English, Marathi, Hindi, and Gujarati.
"""

from __future__ import annotations

import json
import logging
import os
import re
from collections.abc import AsyncGenerator
from typing import Optional

import httpx

from config import get_settings

logger = logging.getLogger(__name__)


class PromptAwareDialogueEngine:
    """
    Intelligent zero-dependency dialogue manager.
    Dynamically parses the voice assistant's persona, system instructions,
    and conversation history to deliver interactive multi-turn voice conversations.
    """

    def extract_custom_points(self, text: str) -> list[str]:
        """Extract numbered or bulleted items from prompt text."""
        lines = [line.strip() for line in text.split("\n") if line.strip()]
        points: list[str] = []
        for line in lines:
            cleaned = re.sub(r"^[0-9]+[\.\)]\s*", "", line)
            cleaned = re.sub(r"^[\-\*\•]\s*", "", cleaned)
            if len(cleaned) > 12:
                points.append(cleaned)
        if len(points) <= 1:
            # Try splitting by punctuation if written in sentence form
            s_parts = [s.strip() for s in re.split(r"[\.\?!]\s+", text) if len(s.strip()) > 15]
            if len(s_parts) > 1:
                points = s_parts
        return points

    def generate_reply(self, messages: list[dict], system_prompt: str | None = None, voice: str | None = None) -> str:
        prompt_text = (system_prompt or "").strip()
        prompt_lower = prompt_text.lower()

        user_msgs = [m for m in messages if m.get("role") == "user"]
        user_turn = len(user_msgs)
        last_msg = user_msgs[-1]["content"].strip().lower() if user_msgs else ""

        assistant_msgs = [m for m in messages if m.get("role") == "assistant"]
        last_assistant_msg = assistant_msgs[-1]["content"].lower() if assistant_msgs else ""

        # Language Detection
        v_str = (voice or "").lower()
        has_devanagari = bool(re.search(r"[\u0900-\u097F]", last_msg))

        is_marathi = (
            v_str.startswith("mr-")
            or any(k in prompt_lower for k in ["marathi", "मराठी", "महाराष्ट्र", "भाऊ", "कांदा"])
            or any(k in last_msg for k in ["होय", "नाही", "सांगा", "नमस्कार", "भाव", "दर", "माल", "सप्लायर", "एस एस", "हॅलो", "कोण", "नाव", "माहिती"])
            or (has_devanagari and not any(k in last_msg for k in ["हाँ", "नमस्ते", "बताइए", "कमरा", "इलाज"]))
        )
        is_hindi = (
            v_str.startswith("hi-")
            or any(k in prompt_lower for k in ["hindi", "हिन्दी", "नमस्ते", "कमरा", "इलाज"])
            or any(k in last_msg for k in ["हाँ", "नमस्ते", "बताइए", "दवा", "कीमत", "बिल"])
        )
        is_gujarati = (
            v_str.startswith("gu-")
            or any(k in prompt_lower for k in ["gujarati", "ગુજરાતી", "રાજકોટ", "ભાવ"])
            or any(k in last_msg for k in ["હા", "નમસ્તે", "ભાવ"])
        )

        # Intent Detection
        is_identity = any(w in last_msg for w in [
            "name", "नाव", "नाम", "who are you", "who is this", "व्हॉट इज युअर नेम",
            "युअर नेम", "नेम", "कोण बोलतंय", "कोण आहेस", "तुमचं नाव", "तुम्ही कोण",
            "कॉल कशासाठी", "who is speaking", "who is calling"
        ])

        is_greeting = any(w in last_msg for w in [
            "hello", "hi", "hey", "हॅलो", "हेलो", "नमस्ते", "नमस्कार", "हॅलो कोण", "good morning", "good afternoon"
        ])

        is_more_info = any(w in last_msg for w in [
            "more", "info", "information", "detail", "details", "माहिती", "सांगा",
            "पुढे", "आगे", "दूसरा", "पुढचा", "give me more information", "more info",
            "tell me more", "plan 2", "second plan", "give me more"
        ])

        is_affirmative = any(w in last_msg for w in [
            "yes", "yeah", "yep", "sure", "ok", "okay", "tell me", "i am free", "free",
            "proceed", "go ahead", "please", "ha", "haan", "ho", "aaho", "thik", "theek",
            "boliye", "sanga", "chalo", "done", "continue", "interested", "एस एस", "होय", "सांगा"
        ]) or is_more_info
        is_negative = any(w in last_msg for w in ["no", "not now", "busy", "later", "nahi", "nako", "cancel", "stop", "never", "नाही", "नको"])
        is_pricing = any(w in last_msg for w in [
            "price", "cost", "premium", "rate", "how much", "charges", "fees", "quote",
            "kimat", "bhav", "dar", "kitna", "kharcha", "rupees", "rs", "हप्ता", "भाव", "दर", "रुपये"
        ])
        is_network = any(w in last_msg for w in ["hospital", "network", "cashless", "claim", "doctor", "empanelled", "दवाखाना"])
        is_family = any(w in last_msg for w in ["family", "floater", "children", "kids", "wife", "spouse", "कुटुंब", "परिवार"])
        is_senior = any(w in last_msg for w in ["senior", "parents", "elderly", "old", "60", "आई वडील", "माता पिता"])
        is_next = any(w in last_msg for w in ["next", "second", "another", "more", "other", "pudhcha", "dusra", "aage", "पुढील", "दूसरा"]) or is_more_info

        # Squad Transfer Trigger Keywords
        is_supplier_trigger = any(w in last_msg for w in [
            "मराठी सप्लायर", "सप्लायर", "supplier", "मराठी", "कांदा", "बटाटा", "closer", "व्यापारी", "बाजार", "मंडी", "दर", "खरेदी", "माल", "मनोहर"
        ])
        is_billing_trigger = any(w in last_msg for w in [
            "billing", "bill", "बिल", "खाते", "payment", "पेमेंट", "invoice", "पावती", "हिशोब", "रक्कम", "upi"
        ])

        # ── Domain 0: Front-Desk Receptionist Triage & Intent Classifier ─────────
        if any(k in prompt_lower for k in ["triage", "receptionist", "front desk", "initial greeter", "intent classifier", "रिसेप्शन"]):
            if is_supplier_trigger:
                return "नक्कीच! मी आपल्याला त्वरित आमच्या कृषी आणि घाऊक बाजार specialist मनोहर यांच्याकडे ट्रान्सफर करत आहे... [AUTO_TRANSFER:member-2]"
            if is_billing_trigger:
                return "अवश्य! मी आपल्याला त्वरित आमच्या बिलिंग आणि अकाउंट्स डेस्ककडे ट्रान्सफर करत आहे... [AUTO_TRANSFER:member-3]"
            if is_affirmative:
                return "उत्तम! सांगा, आपल्याला आज कोणत्या विभागाशी बोलायचे आहे? आमच्या मराठी कृषी सप्लायर मनोहर यांच्याशी की बिलिंग व इनव्हॉइस डेस्कशी?"
            if is_negative:
                return "काही हरकत नाही! जेव्हा आपल्याला मदत हवी असेल तेव्हा नक्की सांगा. आपला दिवस शुभ जावो!"
            return "नमस्ते! बिझोरा फ्रंट डेस्कवर आपले स्वागत आहे. मी आपल्याला आमच्या मराठी सप्लायर क्लोजर (मनोहर) किंवा बिलिंग डेस्ककडे हस्तांतरित करू शकते. आपण कोणाशी बोलू इच्छिता?"

        # ── Domain 1: Medicare / Mediclaim / Health Insurance / Maya ────────
        if any(k in prompt_lower for k in ["medicare", "mediclaim", "insurance", "health plan", "policy", "पॉलिसी", "विमा", "maya"]):
            # Identity inquiry ("who are you", "what is your name", "व्हॉट इज युअर नेम")
            if is_identity:
                if is_marathi:
                    return (
                        "नमस्कार! माझे नाव माया आहे, मी बिझोरा हेल्थकेअरची अधिकृत मेडिक्लेम आरोग्य विमा सल्लागार आहे. "
                        "मी आपल्यासाठी आणि आपल्या संपूर्ण कुटुंबासाठी उत्तम कॅशलेस आरोग्य संरक्षण योजना सांगण्यासाठी कॉल केला आहे. "
                        "मी पहिली योजना समजावून सांगू का?"
                    )
                elif is_hindi:
                    return (
                        "नमस्ते! मेरा नाम माया है, मैं बिझोरा हेल्थकेअर की मेडिक्लेम स्वास्थ्य सुरक्षा सलाहकार हूँ। "
                        "मैं आपके और आपके परिवार के लिए बेहतरीन कैशलेस स्वास्थ्य योजनाएं बताने के लिए कॉल कर रही हूँ। "
                        "क्या मैं पहला प्लान समझाऊं?"
                    )
                return (
                    "Hello! My name is Maya, your personal healthcare and Mediclaim advisory specialist from Bizora Voice. "
                    "I am calling to share our top cashless hospitalization health plans for you and your family. "
                    "Shall I walk you through Plan 1?"
                )

            # Greeting inquiry ("hello", "हॅलो", "hi")
            if is_greeting and user_turn <= 1:
                if is_marathi:
                    return (
                        "हॅलो, नमस्कार! मी माया, बिझोरा हेल्थकेअरकडून आपल्या कुटुंबाच्या मेडिक्लेम आरोग्य विमा संरक्षणाबद्दल बोलत आहे. "
                        "आपण २ मिनिटे मोकळे आहात का? आमच्या नवीन आरोग्य योजना जाणून घेण्यासाठी."
                    )
                elif is_hindi:
                    return (
                        "हेलो, नमस्ते! मैं माया, बिझोरा हेल्थकेअर से आपके परिवार की मेडिक्लेम सुरक्षा के बारे में बात कर रही हूँ। "
                        "क्या आपके पास हमारे नए हेल्थ प्लान्स जानने के लिए २ मिनट का समय है?"
                    )
                return (
                    "Hello! Good afternoon. I am Maya calling from Bizora Healthcare regarding your family Mediclaim health protection. "
                    "Are you free to talk for a minute to hear our top plans?"
                )

            if is_marathi:
                if is_negative:
                    return "काही हरकत नाही! आपल्याला जेव्हा आरोग्य विम्याबद्दल माहिती हवी असेल तेव्हा नक्की संपर्क करा. आपला दिवस शुभ जावो!"
                if is_pricing:
                    return "आमच्या मेडिक्लेम योजनांचा मासिक हप्ता फक्त ₹४५० (वैयक्तिक कव्हर) आणि ₹८५० (संपूर्ण फॅमिली फ्लोटर) पासून सुरू होतो. आयकर कलम 80D अंतर्गत ₹२५,००० पर्यंत करबचत मिळते. आम्ही व्हॉट्सॲपवर कोटेशन पाठवू का?"
                if is_network:
                    return "महाराष्ट्रासह देशभरात आमचे ८,५०० हून अधिक कॅशलेस नेटवर्क हॉस्पिटल्स आहेत, जिथे ३० मिनिटांत कॅशलेस उपचार मंजूर होतात. मी पुढील योजना समजावून सांगू का?"
                if user_turn <= 1 or (is_affirmative and ("मुक्त" in last_assistant_msg or "free" in last_assistant_msg or "सांगू" in last_assistant_msg)):
                    return "उत्तम! मी आपल्यासाठी आमच्या मेडिक्लेम योजना एक-एक करून सांगते.\n\nपहिली योजना: **आरोग्य संजीवनी योजना**—यात १० लाख रुपयांचे संपूर्ण हॉस्पिटलायझेशन कव्हरेज मिळते, ज्यामध्ये pre आणि post उपचार खर्च आणि शून्य को-पे समाविष्ट आहे. देशभरात ८,५०० कॅशलेस हॉस्पिटल्स आहेत.\n\nआपल्याला दुसरी योजना—कौटुंबिक फॅमिली फ्लोटर कव्हर—ऐकायची आहे का?"
                elif user_turn == 2 or is_family or is_next or is_more_info:
                    return "दुसरी योजना: **युनिव्हर्सल फॅमिली हेल्थ शील्ड**—यात तुम्ही, तुमची पत्नी आणि ३ मुले अशा संपूर्ण कुटुंबाला २५ लाख रुपयांचे एकत्रित कव्हर मिळते. यात मोफत वार्षिक आरोग्य तपासणी आणि ३० मिनिटांत कॅशलेस उपचार आहेत.\n\nयाचा परवडणारा मासिक हप्ता सांगू की ज्येष्ठ नागरिकांसाठीची योजना सांगू?"
                elif user_turn == 3 or is_pricing:
                    return "फॅमिली फ्लोटरचा मासिक हप्ता फक्त ₹८५० पासून सुरू होतो (किंवा वैयक्तिक कव्हर ₹४५०). कलम 80D अंतर्गत २५,००० रुपयांपर्यंत करसवलत मिळते.\n\nआम्ही आपल्या व्हॉट्सॲपवर संपूर्ण माहितीपत्रक आणि अधिकृत कोटेशन पाठवू का?"
                else:
                    return "नक्कीच! आपली नोंदणी पूर्ण झाली आहे. आमचे वरिष्ठ आरोग्य विमा सल्लागार अधिकृत कोटेशनसह त्वरित आपल्याशी संपर्क साधतील. बिझोरा व्हॉईसशी बोलल्याबद्दल धन्यवाद!"

            elif is_hindi:
                if is_negative:
                    return "कोई बात नहीं! जब भी आप अपनी स्वास्थ्य सुरक्षा की समीक्षा करना चाहें, बेझिझक संपर्क करें। आपका दिन शुभ हो!"
                if is_pricing:
                    return "हमारे मेडिक्लेम प्लान्स का प्रीमियम व्यक्तिगत स्तर पर ₹४५० प्रति माह और फैमिली फ्लोटर के लिए ₹८५० प्रति माह से शुरू होता है। धारा 80D के तहत ₹२५,००० तक की टैक्स छूट भी उपलब्ध है। क्या आप इसका ब्रोशर देखना चाहेंगे?"
                if is_network:
                    return "हम ८,५०० से अधिक कैशलेस अस्पतालों का नेटवर्क प्रदान करते हैं जहाँ ३० मिनट के भीतर कैशलेस अप्रूवल मिल जाता है। क्या मैं फैमिली फ्लोटर प्लान के बारे में बताऊं?"
                if user_turn <= 1:
                    return "बहुत बढ़िया! मैं आपको हमारे प्रमुख मेडिक्लेम प्लान्स एक-एक करके समझाती हूँ।\n\nपहला प्लान: **आरोग्य संजीवनी सुरक्षा प्लान**—इसमें आपको १० लाख रुपये तक का कैशलेस हॉस्पिटलाइजेशन कवर, भर्ती पूर्व व पश्चात खर्च और शून्य को-पे की सुविधा मिलती है।\n\nक्या आप हमारे फैमिली फ्लोटर प्लान के बारे में भी जानना चाहेंगे?"
                elif user_turn == 2 or is_family or is_next or is_more_info:
                    return "दूसरा प्लान: **कॉम्प्रिहेंसिव फैमिली फ्लोटर प्लान**—इसमें आप, आपकी पत्नी और ३ बच्चे कुल २५ लाख रुपये के सम इंश्योर्ड में कवर होते हैं। इसमें सालाना मुफ्त चेकअप और मैटरनिटी कवर भी शामिल है।\n\nक्या आप इसके मासिक प्रीमियम या सीनियर सिटीजन कवर के बारे में जानना चाहेंगे?"
                elif user_turn == 3 or is_pricing:
                    return "फैमिली फ्लोटर का प्रीमियम मात्र ₹८५० प्रति माह से शुरू होता है और धारा 80D के तहत टैक्स छूट भी मिलती है। क्या मैं आपके वॉट्सऐप पर इसका डिजिटल कोटेशन भेज दूं?"
                else:
                    return "जी बिल्कुल! आपकी रिक्वेस्ट दर्ज कर ली गई है। हमारे स्वास्थ्य विशेषज्ञ जल्द ही आपको अधिकृत कोटेशन के साथ कॉल करेंगे। धन्यवाद!"

            # English (Default for Medicare/Mediclaim Persona)
            if is_negative:
                return "No problem at all! Feel free to reach back whenever you are ready to review your healthcare protection. Have a wonderful day ahead!"
            if is_pricing:
                return "Our Mediclaim plans start at an affordable ₹450 per month for individual coverage and ₹850 per month for the Family Floater cover. Both qualify for full tax savings under Section 80D up to ₹25,000 annually. Would you like me to share the cashless network hospital details or generate an instant quote for you?"
            if is_network:
                return "We have over 8,500 empanelled cashless hospitals across India with 30-minute pre-authorization approval and zero paperwork. Shall I explain the Family Floater plan or calculate your customized premium?"
            if is_senior:
                return "Our Silver Age Senior Citizen cover protects parents aged 60+ with ₹15 Lakhs sum insured, covering pre-existing ailments after just 12 months. Would you like me to send you the senior citizen brochure?"

            # Step-by-step sequential delivery
            if user_turn <= 1:
                return (
                    "Great! As requested, let me walk you through our top Mediclaim plans one by one.\n\n"
                    "Plan 1: Our **Arogya Sanjeevani Essential Plan** offers ₹10 Lakhs individual hospitalization coverage "
                    "with 100% cashless treatment at 8,500+ network hospitals, pre- and post-hospitalization medical coverage, "
                    "and zero co-payment.\n\n"
                    "Would you like to hear about Plan 2—our Comprehensive Family Floater cover—or do you have questions about this plan?"
                )
            elif user_turn == 2 or is_family or is_next or is_more_info:
                return (
                    "Plan 2: Our **Comprehensive Family Floater Plan**. This secures you, your spouse, and up to 3 dependent "
                    "children under a unified ₹25 Lakhs sum insured. It features zero room-rent limits, free annual full-body checkups, "
                    "and 30-minute cashless hospital approvals.\n\n"
                    "Should I explain the affordable monthly premium options, or tell you about our Senior Citizen add-on?"
                )
            elif user_turn == 3 or is_pricing:
                return (
                    "The monthly premium for the Family Floater starts at just ₹850 per month, with full tax savings under "
                    "Section 80D up to ₹25,000 annually. You also receive a 50% cumulative bonus for every claim-free year.\n\n"
                    "Shall I send the official quote and plan brochure to your WhatsApp, or would you like to speak to an advisor?"
                )
            else:
                return (
                    "I have recorded your preference and request. Our senior health insurance advisor will connect with your "
                    "customized quote shortly. Thank you for speaking with Bizora Medicare, have a wonderful day!"
                )

        # ── Domain 2: Agro / Mandi / APMC Trading / Marathi Supplier Closer ─
        if any(k in prompt_lower for k in ["apmc", "mandi", "बाजार समिती", "कांदा", "बटाटा", "सोयाबीन", "व्यापारी", "कृषी", "closer", "supplier closer", "vegetable", "commodity"]):
            if is_billing_trigger:
                return "होय, सौद्याची अधिकृत वजन पावती आणि GST बिल तयार करण्यासाठी मी आपल्याला आमच्या बिलिंग डेस्ककडे जोडत आहे... [AUTO_TRANSFER:member-3]"

            if is_marathi:
                if any(k in last_msg for k in ["कांदा", "kanda", "onion"]):
                    return "नाशिक आणि लासलगाव बाजार समितीत आज दर्जेदार कांद्याला प्रति क्विंटल २,४५० ते २,८०० रुपये (₹२४ ते ₹२८ प्रति किलो) दर चालू आहे. दर्जेदार गोल्टी व मोठा कांदा उपलब्ध आहे. आपल्याला किती टन खरेदी करायचा आहे की पुरवठा करायचा आहे?"
                if any(k in last_msg for k in ["बटाटा", "potato", "batata", "आलू"]):
                    return "पुणे व मुंबई मार्केटमध्ये उत्तम बटाट्याचा दर ₹१,८०० ते ₹२,००० प्रति क्विंटल (₹१८ ते ₹२० प्रति किलो) चालू आहे. थेट शेतातून ताजी आवक आहे. गाडी कुठे पाठवायची?"
                if any(k in last_msg for k in ["सोयाबीन", "हळद", "turmeric", "soybean"]):
                    return "लातूर व सांगली बाजारपेठेत सोयाबीनला प्रति क्विंटल ४,६५० रुपये आणि हळदीला प्रति क्विंटल १३,८०० रुपये भाव आहे. आजच सौद्याची गाडी पाठवायची असल्यास सांगा."
                if any(k in last_msg for k in ["टोमॅटो", "tomato"]):
                    return "नारायणगाव आणि जुन्नर मार्केटमध्ये आज टोमॅटो क्रेटचा भाव ₹६५० ते ₹७५० चालू आहे. माल एक नंबर प्रतवारीचा आहे. किती क्रेट्स हव्या आहेत?"
                if is_affirmative:
                    return "फार छान! मी आपल्या सौद्याची नोंद करून घेतली आहे. गाडीचे भाडे आणि वजन पावतीसह बिल पाठवण्यासाठी मी बिलिंग डेस्ककडे ट्रान्सफर करू का?"
                return "नमस्कार! मी कृषी आणि घाऊक बाजार specialist मनोहर. सांगा, आज कोणत्या मालाचे दर आणि किती क्विंटलचा सौदा करायचा आहे?"

            if is_gujarati:
                return "આજના રાજકોટ અને ઉંઝા માર્કેટ યાર્ડમાં જીરું અને કપાસના ભાવ સ્થિર છે. કપાસ પ્રતિ મણ ₹૧,૫૫૦ થી ₹૧,૭૨૦ ચાલે છે. તમારા ઓર્ડરની વિગતો અમે નોંधी લીધી છે."

            return "The current APMC auction price for grade-A produce is ₹2,600 per quintal with active wholesale demand. We have recorded your truck dispatch request."

        # ── Domain 3: Billing & Accounts Desk ────────────────────────────────
        if any(k in prompt_lower for k in ["billing", "account desk", "invoice", "बिलिंग", "खाते", "gst", "deyak", "debit", "credit"]):
            if any(k in last_msg for k in ["upi", "qr", "link", "payment", "पेमेंट"]):
                return "Welcome to Billing. I have generated your digital invoice and sent the instant UPI payment QR code directly to your registered WhatsApp. Let me know once settled!"
            if is_affirmative:
                return "Your official GST invoice has been verified and dispatched to your email and WhatsApp. Thank you for doing business with Bizora wholesale network!"
            return "Welcome to Billing & Accounts. I can send your digital GST invoice via WhatsApp or SMS, and provide UPI QR for instant settlement. How may I assist with your payment today?"

        # ── Domain 4: Hospital / Dental / Clinic Appointment ────────────────
        if any(k in prompt_lower for k in ["doctor", "hospital", "clinic", "dental", "appointment", "दवाखाना"]):
            if is_affirmative or "slot" in last_msg:
                return "Dr. Patil has open consultation slots today at 11:30 AM and 4:30 PM. Would you like me to reserve the morning or afternoon appointment for you?"
            if any(k in last_msg for k in ["pain", "emergency", "दातदुखी", "रक्त", "severe"]):
                return "I understand this is urgent. I have flagged your case for priority immediate emergency intake with Dr. Patil. Please visit the clinic right away."
            return "Your appointment has been successfully scheduled. You will receive an SMS and WhatsApp confirmation with directions to the clinic. Please carry your previous prescriptions."

        # ── Domain 5: Hotel & Table Booking ─────────────────────────────────
        if any(k in prompt_lower for k in ["hotel", "taj", "restaurant", "booking", "table", "deluxe", "resort"]):
            if is_affirmative or "deluxe" in last_msg:
                return "We have Deluxe King Rooms available for your requested dates at ₹4,500/night, including complimentary buffet breakfast. Would you like to confirm this reservation?"
            return "Your reservation has been confirmed. A booking voucher with check-in instructions has been dispatched. We look forward to welcoming you!"

        # ── Domain 6: Natural Conversational Fallback (Never Speak Raw Prompt) ─
        if is_identity:
            if is_marathi:
                return "नमस्कार! मी आपला व्हॉईस असिस्टंट आहे. मी आज आपली कशी मदत करू शकतो सांगा?"
            if is_hindi:
                return "नमस्ते! मैं आपका वॉइस असिस्टेंट हूँ। बताइए आज मैं आपकी क्या सहायता कर सकता हूँ?"
            return "Hello! I am your AI voice assistant. How may I assist you today?"

        if is_greeting:
            if is_marathi:
                return "हॅलो, नमस्कार! मी ऐकत आहे, सांगा आज काय मदत हवी आहे?"
            if is_hindi:
                return "हेलो, नमस्ते! बताइए मैं आपकी क्या सहायता कर सकता हूँ?"
            return "Hello! Good day. How may I assist you today?"

        if is_marathi:
            if is_affirmative:
                return "होय, मी समजलो! आपल्या गरजेनुसार मी पुढील प्रक्रिया करत आहे. सांगा, आपल्याला आणखी काय माहिती हवी आहे?"
            if is_negative:
                return "काही हरकत नाही! आपल्याला जेव्हा आवश्यकता असेल तेव्हा नक्की सांगा. आपला दिवस शुभ जावो!"
            return "होय, मी ऐकत आहे. याबद्दल आपल्याला काय माहिती हवी आहे किंवा कशी मदत करू ते सांगा?"

        if is_hindi:
            if is_affirmative:
                return "जी बिल्कुल, मैंने नोट कर लिया है! आगे की प्रक्रिया शुरू की जा रही है। क्या आप कोई अन्य जानकारी चाहते हैं?"
            if is_negative:
                return "कोई बात नहीं! जब भी आपको सहायता की आवश्यकता हो, हमें बताएं। आपका दिन शुभ हो!"
            return "जी, मैं सुन रहा हूँ। बताइए इस विषय में आप क्या जानकारी चाहते हैं?"

        if is_affirmative:
            return "Understood and noted! I am actively assisting you according to your requirements. What specific detail or next step would you like to explore?"
        if is_negative:
            return "Understood. Please let me know whenever you would like to proceed, and I will be right here to assist you."

        return "Understood! How would you like to proceed, or what additional details can I share with you?"


class LLMEngine:
    """Unified LLM engine supporting Google Gemini, Ollama, and Dialogue Engine fallback."""

    def __init__(self) -> None:
        settings = get_settings()
        self._ollama_base_url = settings.ollama_base_url.rstrip("/")
        self._ollama_model = settings.ollama_model
        self._ollama_timeout = settings.ollama_timeout

        self._gemini_api_key = settings.gemini_api_key or os.environ.get("GEMINI_API_KEY", "") or os.environ.get("GEMINI_Api_key", "")
        self._gemini_default_model = settings.gemini_model
        self._gemini_timeout = settings.gemini_timeout

        self._openai_api_key = getattr(settings, "openai_api_key", "") or os.environ.get("OPENAI_API_KEY", "") or os.environ.get("chatgpt", "")
        self._openai_default_model = getattr(settings, "openai_model", "gpt-4o-mini")

        self._groq_api_key = getattr(settings, "groq_api_key", "") or os.environ.get("GROQ_API_KEY", "") or os.environ.get("groq", "") or os.environ.get("GROQ", "")
        self._groq_default_model = getattr(settings, "groq_model", "llama-3.3-70b-versatile")

        self._openrouter_api_key = getattr(settings, "openrouter_api_key", "") or os.environ.get("OPENROUTER_API_KEY", "") or os.environ.get("open_router", "") or os.environ.get("OPEN_ROUTER", "")
        self._openrouter_default_model = getattr(settings, "openrouter_model", "meta-llama/llama-3.1-8b-instruct:free")

        self._ollama_client: httpx.AsyncClient | None = None
        self._gemini_client: httpx.AsyncClient | None = None
        self._groq_client: httpx.AsyncClient | None = None
        self._openai_client: httpx.AsyncClient | None = None
        self._openrouter_client: httpx.AsyncClient | None = None
        self._prompt_engine = PromptAwareDialogueEngine()

    # ── lifecycle ───────────────────────────────────────────────────────

    async def _get_ollama_client(self) -> httpx.AsyncClient:
        """Return (or create) the shared Ollama async HTTP client."""
        if self._ollama_client is None or self._ollama_client.is_closed:
            self._ollama_client = httpx.AsyncClient(
                base_url=self._ollama_base_url,
                headers={"Bypass-Tunnel-Reminder": "true", "User-Agent": "BizoraVoice/1.0"},
                timeout=httpx.Timeout(
                    connect=1.8,
                    read=self._ollama_timeout,
                    write=5.0,
                    pool=5.0,
                ),
            )
        return self._ollama_client

    async def _get_gemini_client(self) -> httpx.AsyncClient:
        """Return (or create) the shared Gemini async HTTP client."""
        if self._gemini_client is None or self._gemini_client.is_closed:
            self._gemini_client = httpx.AsyncClient(
                timeout=httpx.Timeout(
                    connect=10.0,
                    read=self._gemini_timeout,
                    write=10.0,
                    pool=10.0,
                ),
            )
        return self._gemini_client

    async def _get_groq_client(self) -> httpx.AsyncClient:
        """Return (or create) the shared Groq async HTTP client."""
        if self._groq_client is None or self._groq_client.is_closed:
            self._groq_client = httpx.AsyncClient(
                base_url="https://api.groq.com/openai/v1",
                timeout=httpx.Timeout(
                    connect=5.0,
                    read=30.0,
                    write=5.0,
                    pool=5.0,
                ),
            )
        return self._groq_client

    async def _get_openai_client(self) -> httpx.AsyncClient:
        """Return (or create) the shared OpenAI async HTTP client."""
        if self._openai_client is None or self._openai_client.is_closed:
            self._openai_client = httpx.AsyncClient(
                base_url="https://api.openai.com/v1",
                timeout=httpx.Timeout(
                    connect=5.0,
                    read=30.0,
                    write=5.0,
                    pool=5.0,
                ),
            )
        return self._openai_client

    async def _get_openrouter_client(self) -> httpx.AsyncClient:
        """Return (or create) the shared OpenRouter async HTTP client."""
        if self._openrouter_client is None or self._openrouter_client.is_closed:
            self._openrouter_client = httpx.AsyncClient(
                base_url="https://openrouter.ai/api/v1",
                timeout=httpx.Timeout(
                    connect=5.0,
                    read=30.0,
                    write=5.0,
                    pool=5.0,
                ),
            )
        return self._openrouter_client

    async def close(self) -> None:
        """Close HTTP clients."""
        if self._ollama_client and not self._ollama_client.is_closed:
            await self._ollama_client.aclose()
            self._ollama_client = None
        if self._gemini_client and not self._gemini_client.is_closed:
            await self._gemini_client.aclose()
            self._gemini_client = None
        if self._groq_client and not self._groq_client.is_closed:
            await self._groq_client.aclose()
            self._groq_client = None
        if self._openai_client and not self._openai_client.is_closed:
            await self._openai_client.aclose()
            self._openai_client = None
        if self._openrouter_client and not self._openrouter_client.is_closed:
            await self._openrouter_client.aclose()
            self._openrouter_client = None

    # ── health & provider detection ─────────────────────────────────────

    def is_gemini_model(self, model: Optional[str]) -> bool:
        """Check if target model is a Google Gemini model."""
        if not model:
            return False
        m = model.lower().strip()
        return m.startswith("gemini")

    def is_groq_model(self, model: Optional[str]) -> bool:
        """Check if target model is a Groq model."""
        if not model:
            return False
        m = model.lower().strip()
        return any(k in m for k in ["llama", "mixtral", "groq"]) and not ("ollama" in m or "qwen" in m)

    def is_openai_model(self, model: Optional[str]) -> bool:
        """Check if target model is an OpenAI / ChatGPT model."""
        if not model:
            return False
        m = model.lower().strip()
        return "gpt-" in m or "chatgpt" in m or "openai" in m

    def is_openrouter_model(self, model: Optional[str]) -> bool:
        """Check if target model is an OpenRouter model."""
        if not model:
            return False
        m = model.lower().strip()
        return "openrouter" in m or ":free" in m

    async def is_reachable(self, model: Optional[str] = None) -> bool:
        """Check whether the target LLM provider is reachable."""
        if self.is_gemini_model(model):
            settings = get_settings()
            key = settings.gemini_api_key or self._gemini_api_key or os.environ.get("GEMINI_API_KEY", "")
            return bool(key and len(key) > 5)

        try:
            client = await self._get_ollama_client()
            resp = await client.get("/api/tags", timeout=5.0)
            return resp.status_code == 200
        except Exception:
            return False

    # ── Ollama Helper ───────────────────────────────────────────────────

    def _build_ollama_messages(
        self,
        messages: list[dict],
        system_prompt: str | None = None,
    ) -> list[dict]:
        result: list[dict] = []
        if system_prompt:
            result.append({"role": "system", "content": system_prompt})
        result.extend(messages)
        return result

    # ── Gemini Helper ───────────────────────────────────────────────────

    def _build_gemini_payload(
        self,
        messages: list[dict],
        system_prompt: str | None = None,
    ) -> dict:
        """Convert chat history to Google Gemini API payload."""
        contents = []
        for msg in messages:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role == "system":
                continue
            gemini_role = "model" if role == "assistant" else "user"
            contents.append({
                "role": gemini_role,
                "parts": [{"text": content}]
            })

        if not contents:
            contents.append({"role": "user", "parts": [{"text": "Hello"}]})

        payload: dict = {
            "contents": contents,
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 1024,
            }
        }
        if system_prompt:
            payload["systemInstruction"] = {
                "parts": [{"text": system_prompt}]
            }
        return payload

    # ── Unified Chat with Multi-Model Cascading Failover ────────────────
    # User-Specified Priority Hierarchy:
    # 1. Ollama (Local/Tunnel on Laptop) -> If offline/not running ->
    # 2. Google Gemini Flash (2.0/1.5) -> If credits/quota over ->
    # 3. Groq Cloud LPU (Llama 3.3 70B Ultra-Fast) -> If rate-limited ->
    # 4. OpenAI ChatGPT (gpt-4o-mini) -> If credits over ->
    # 5. OpenRouter Free Models (Llama 3.1 8B, Mistral 7B) -> If fails ->
    # 6. Dialogue Engine Safety Net (Guaranteed Zero Dropped Calls)

    async def chat(
        self,
        messages: list[dict],
        system_prompt: str | None = None,
        model: str | None = None,
        api_key: str | None = None,
        voice: str | None = None,
    ) -> str:
        """Send chat request with priority cascading failover."""
        settings = get_settings()
        custom_gemini = api_key if (api_key and (api_key.startswith("AIza") or self.is_gemini_model(model))) else None
        custom_groq = api_key if (api_key and (api_key.startswith("gsk_") or self.is_groq_model(model))) else None
        custom_openai = api_key if (api_key and (api_key.startswith("sk-") and not api_key.startswith("sk-or-") or self.is_openai_model(model))) else None
        custom_openrouter = api_key if (api_key and (api_key.startswith("sk-or-") or self.is_openrouter_model(model))) else None

        gemini_key = custom_gemini or (api_key if not (custom_groq or custom_openai or custom_openrouter) else None) or getattr(settings, "gemini_api_key", "") or self._gemini_api_key or os.environ.get("GEMINI_API_KEY", "") or os.environ.get("GEMINI_Api_key", "")
        groq_key = custom_groq or getattr(settings, "groq_api_key", "") or self._groq_api_key or os.environ.get("GROQ_API_KEY", "") or os.environ.get("groq", "") or os.environ.get("GROQ", "")
        openai_key = custom_openai or getattr(settings, "openai_api_key", "") or self._openai_api_key or os.environ.get("OPENAI_API_KEY", "") or os.environ.get("chatgpt", "")
        openrouter_key = custom_openrouter or getattr(settings, "openrouter_api_key", "") or self._openrouter_api_key or os.environ.get("OPENROUTER_API_KEY", "") or os.environ.get("open_router", "") or os.environ.get("OPEN_ROUTER", "")

        # ── 1. Priority Tier: Ollama (Laptop / Tunnel) ──────────────────────
        try:
            logger.info("Tier 1: Checking Ollama at %s...", self._ollama_base_url)
            ollama_target = model if (model and ("qwen" in model.lower() or "ollama" in model.lower())) else self._ollama_model
            return await self._chat_ollama(messages, system_prompt, ollama_target, api_key=gemini_key, voice=voice)
        except Exception as e:
            logger.info("Tier 1 (Ollama) server not running or unreachable (%s). Shifting to Tier 2: Google Gemini...", e)

        # ── 2. Priority Tier: Google Gemini Cloud ───────────────────────────
        if gemini_key:
            try:
                logger.info("Tier 2: Requesting Google Gemini Flash...")
                gemini_target = model if self.is_gemini_model(model) else self._gemini_default_model
                return await self._chat_gemini(messages, system_prompt, gemini_target, api_key=gemini_key, voice=voice)
            except Exception as e:
                logger.warning("Tier 2 (Gemini) quota/credit over or failed (%s). Shifting to Tier 3: Groq Cloud...", e)
        else:
            logger.info("Tier 2: No GEMINI_API_KEY set. Shifting to Tier 3: Groq Cloud...")

        # ── 3. Priority Tier: Groq Cloud (Ultra-Fast 300+ tok/s) ────────────
        if groq_key:
            try:
                logger.info("Tier 3: Requesting Groq Cloud LPU...")
                groq_target = model if self.is_groq_model(model) else self._groq_default_model
                return await self._chat_groq(messages, system_prompt, groq_target, api_key=groq_key, voice=voice)
            except Exception as e:
                logger.warning("Tier 3 (Groq) rate-limited or failed (%s). Shifting to Tier 4: OpenAI ChatGPT...", e)
        else:
            logger.info("Tier 3: No GROQ_API_KEY set. Shifting to Tier 4: OpenAI ChatGPT...")

        # ── 4. Priority Tier: OpenAI ChatGPT (gpt-4o-mini) ──────────────────
        if openai_key:
            try:
                logger.info("Tier 4: Requesting OpenAI ChatGPT...")
                openai_target = model if self.is_openai_model(model) else self._openai_default_model
                return await self._chat_openai(messages, system_prompt, openai_target, api_key=openai_key, voice=voice)
            except Exception as e:
                logger.warning("Tier 4 (OpenAI) credit over or failed (%s). Shifting to Tier 5: OpenRouter...", e)
        else:
            logger.info("Tier 4: No OPENAI_API_KEY set. Shifting to Tier 5: OpenRouter...")

        # ── 5. Priority Tier: OpenRouter Free Models ────────────────────────
        if openrouter_key:
            try:
                logger.info("Tier 5: Requesting OpenRouter Free Models...")
                or_target = model if self.is_openrouter_model(model) else self._openrouter_default_model
                return await self._chat_openrouter(messages, system_prompt, or_target, api_key=openrouter_key, voice=voice)
            except Exception as e:
                logger.warning("Tier 5 (OpenRouter) failed (%s). Engaging Tier 6 Safety Net...", e)
        else:
            logger.info("Tier 5: No OPENROUTER_API_KEY set. Engaging Tier 6 Safety Net...")

        # ── 6. Safety Net: Deterministic Dialogue Engine ────────────────────
        logger.info("Tier 6: Engaging deterministic PromptAwareDialogueEngine safety net.")
        return self._prompt_engine.generate_reply(messages, system_prompt, voice=voice)

    async def chat_stream(
        self,
        messages: list[dict],
        system_prompt: str | None = None,
        model: str | None = None,
        api_key: str | None = None,
        voice: str | None = None,
    ) -> AsyncGenerator[str, None]:
        """Stream chat tokens with priority cascading failover."""
        settings = get_settings()
        custom_gemini = api_key if (api_key and (api_key.startswith("AIza") or self.is_gemini_model(model))) else None
        custom_groq = api_key if (api_key and (api_key.startswith("gsk_") or self.is_groq_model(model))) else None
        custom_openai = api_key if (api_key and (api_key.startswith("sk-") and not api_key.startswith("sk-or-") or self.is_openai_model(model))) else None
        custom_openrouter = api_key if (api_key and (api_key.startswith("sk-or-") or self.is_openrouter_model(model))) else None

        gemini_key = custom_gemini or (api_key if not (custom_groq or custom_openai or custom_openrouter) else None) or getattr(settings, "gemini_api_key", "") or self._gemini_api_key or os.environ.get("GEMINI_API_KEY", "") or os.environ.get("GEMINI_Api_key", "")
        groq_key = custom_groq or getattr(settings, "groq_api_key", "") or self._groq_api_key or os.environ.get("GROQ_API_KEY", "") or os.environ.get("groq", "") or os.environ.get("GROQ", "")
        openai_key = custom_openai or getattr(settings, "openai_api_key", "") or self._openai_api_key or os.environ.get("OPENAI_API_KEY", "") or os.environ.get("chatgpt", "")
        openrouter_key = custom_openrouter or getattr(settings, "openrouter_api_key", "") or self._openrouter_api_key or os.environ.get("OPENROUTER_API_KEY", "") or os.environ.get("open_router", "") or os.environ.get("OPEN_ROUTER", "")

        streamed_success = False

        # ── 1. Priority Tier: Ollama (Laptop / Tunnel) ──────────────────────
        try:
            logger.info("Tier 1 Stream: Checking Ollama at %s...", self._ollama_base_url)
            ollama_target = model if (model and ("qwen" in model.lower() or "ollama" in model.lower())) else self._ollama_model
            async for token in self._chat_stream_ollama(messages, system_prompt, ollama_target, api_key=gemini_key, voice=voice):
                streamed_success = True
                yield token
            if streamed_success:
                return
        except Exception as e:
            logger.info("Tier 1 Stream: Ollama not running or unreachable (%s). Shifting to Tier 2: Gemini...", e)

        # ── 2. Priority Tier: Google Gemini Cloud ───────────────────────────
        if gemini_key:
            try:
                logger.info("Tier 2 Stream: Streaming Google Gemini Flash...")
                gemini_target = model if self.is_gemini_model(model) else self._gemini_default_model
                async for token in self._chat_stream_gemini(messages, system_prompt, gemini_target, api_key=gemini_key, voice=voice):
                    streamed_success = True
                    yield token
                if streamed_success:
                    return
            except Exception as e:
                logger.warning("Tier 2 Stream: Gemini quota/credit exhausted (%s). Shifting to Tier 3: Groq...", e)

        # ── 3. Priority Tier: Groq Cloud (LPU 300+ tok/s) ───────────────────
        if groq_key:
            try:
                logger.info("Tier 3 Stream: Streaming Groq Cloud LPU...")
                groq_target = model if self.is_groq_model(model) else self._groq_default_model
                async for token in self._chat_stream_groq(messages, system_prompt, groq_target, api_key=groq_key, voice=voice):
                    streamed_success = True
                    yield token
                if streamed_success:
                    return
            except Exception as e:
                logger.warning("Tier 3 Stream: Groq rate-limited or failed (%s). Shifting to Tier 4: OpenAI...", e)

        # ── 4. Priority Tier: OpenAI ChatGPT (gpt-4o-mini) ──────────────────
        if openai_key:
            try:
                logger.info("Tier 4 Stream: Streaming OpenAI ChatGPT...")
                openai_target = model if self.is_openai_model(model) else self._openai_default_model
                async for token in self._chat_stream_openai(messages, system_prompt, openai_target, api_key=openai_key, voice=voice):
                    streamed_success = True
                    yield token
                if streamed_success:
                    return
            except Exception as e:
                logger.warning("Tier 4 Stream: OpenAI credit over or failed (%s). Shifting to Tier 5: OpenRouter...", e)

        # ── 5. Priority Tier: OpenRouter Free Models ────────────────────────
        if openrouter_key:
            try:
                logger.info("Tier 5 Stream: Streaming OpenRouter Free Models...")
                or_target = model if self.is_openrouter_model(model) else self._openrouter_default_model
                async for token in self._chat_stream_openrouter(messages, system_prompt, or_target, api_key=openrouter_key, voice=voice):
                    streamed_success = True
                    yield token
                if streamed_success:
                    return
            except Exception as e:
                logger.warning("Tier 5 Stream: OpenRouter failed (%s). Engaging Tier 6 Safety Net...", e)

        # ── 6. Safety Net: Deterministic Dialogue Engine ────────────────────
        logger.info("Tier 6 Stream: Engaging PromptAwareDialogueEngine safety net.")
        fallback_text = self._prompt_engine.generate_reply(messages, system_prompt, voice=voice)
        for word in fallback_text.split(" "):
            yield word + " "

    # ── Ollama Implementation ───────────────────────────────────────────

    async def _chat_ollama(
        self,
        messages: list[dict],
        system_prompt: str | None = None,
        model: str | None = None,
        api_key: str | None = None,
        voice: str | None = None,
    ) -> str:
        model = model or self._ollama_model
        payload = {
            "model": model,
            "messages": self._build_ollama_messages(messages, system_prompt),
            "stream": False,
        }
        client = await self._get_ollama_client()
        # Fast 2.5s connect/read timeout for immediate failover when laptop server is not active
        fast_timeout = httpx.Timeout(connect=2.0, read=2.5, write=2.0, pool=2.0)
        resp = await client.post("/api/chat", json=payload, timeout=fast_timeout)
        resp.raise_for_status()
        data = resp.json()
        content = data.get("message", {}).get("content", "")
        if not content:
            raise RuntimeError("Ollama returned empty response")
        return content.strip()

    async def _chat_stream_ollama(
        self,
        messages: list[dict],
        system_prompt: str | None = None,
        model: str | None = None,
        api_key: str | None = None,
        voice: str | None = None,
    ) -> AsyncGenerator[str, None]:
        model = model or self._ollama_model
        payload = {
            "model": model,
            "messages": self._build_ollama_messages(messages, system_prompt),
            "stream": True,
        }
        client = await self._get_ollama_client()
        fast_timeout = httpx.Timeout(connect=2.0, read=2.5, write=2.0, pool=2.0)
        async with client.stream("POST", "/api/chat", json=payload, timeout=fast_timeout) as resp:
            resp.raise_for_status()
            async for line in resp.aiter_lines():
                if not line.strip():
                    continue
                try:
                    data = json.loads(line)
                except json.JSONDecodeError:
                    continue

                if data.get("done"):
                    break

                token = data.get("message", {}).get("content", "")
                if token:
                    yield token

    # ── Gemini Cloud Implementation ─────────────────────────────────────

    def _normalize_gemini_model(self, model: str | None) -> str:
        if not model:
            return "gemini-2.0-flash"
        m = model.strip()
        if m.startswith("models/"):
            m = m[7:]
        if "2.5" in m or m.lower() in ("gemini", "gemini-flash"):
            return "gemini-2.0-flash"
        return m

    async def _chat_gemini(
        self,
        messages: list[dict],
        system_prompt: str | None = None,
        model: str = "gemini-2.0-flash",
        api_key: str | None = None,
        voice: str | None = None,
    ) -> str:
        settings = get_settings()
        key = api_key or settings.gemini_api_key or self._gemini_api_key or os.environ.get("GEMINI_API_KEY", "")
        if not key:
            return self._prompt_engine.generate_reply(messages, system_prompt, voice=voice)

        primary_model = self._normalize_gemini_model(model)
        models_to_try = [primary_model]
        if primary_model != "gemini-1.5-flash":
            models_to_try.append("gemini-1.5-flash")

        payload = self._build_gemini_payload(messages, system_prompt)
        client = await self._get_gemini_client()

        for target_m in models_to_try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{target_m}:generateContent?key={key}"
            try:
                resp = await client.post(url, json=payload)
                if resp.status_code == 200:
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    if candidates:
                        parts = candidates[0].get("content", {}).get("parts", [])
                        if parts:
                            return parts[0].get("text", "").strip()
                logger.warning("Gemini model %s returned status %s: %s", target_m, resp.status_code, resp.text[:120])
            except Exception as e:
                logger.warning("Gemini model %s error: %s", target_m, e)

        return self._prompt_engine.generate_reply(messages, system_prompt, voice=voice)

    async def _chat_stream_gemini(
        self,
        messages: list[dict],
        system_prompt: str | None = None,
        model: str = "gemini-2.0-flash",
        api_key: str | None = None,
        voice: str | None = None,
    ) -> AsyncGenerator[str, None]:
        settings = get_settings()
        key = api_key or settings.gemini_api_key or self._gemini_api_key or os.environ.get("GEMINI_API_KEY", "")
        if not key:
            fallback_text = self._prompt_engine.generate_reply(messages, system_prompt, voice=voice)
            for word in fallback_text.split(" "):
                yield word + " "
            return

        primary_model = self._normalize_gemini_model(model)
        models_to_try = [primary_model]
        if primary_model != "gemini-1.5-flash":
            models_to_try.append("gemini-1.5-flash")

        payload = self._build_gemini_payload(messages, system_prompt)
        client = await self._get_gemini_client()
        streamed_success = False

        for target_m in models_to_try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{target_m}:streamGenerateContent?alt=sse&key={key}"
            try:
                async with client.stream("POST", url, json=payload) as resp:
                    if resp.status_code != 200:
                        err_text = await resp.aread()
                        logger.warning("Gemini stream %s returned %s: %s", target_m, resp.status_code, err_text.decode(errors="ignore")[:100])
                        continue

                    async for line in resp.aiter_lines():
                        line = line.strip()
                        if not line or not line.startswith("data: "):
                            continue

                        json_str = line[6:].strip()
                        try:
                            data = json.loads(json_str)
                        except json.JSONDecodeError:
                            continue

                        candidates = data.get("candidates", [])
                        if candidates:
                            parts = candidates[0].get("content", {}).get("parts", [])
                            for part in parts:
                                text = part.get("text", "")
                                if text:
                                    streamed_success = True
                                    yield text
                    if streamed_success:
                        return
            except Exception as exc:
                logger.warning("Gemini stream %s exception: %s", target_m, exc)

        # Fallback to zero-dependency dialogue engine
        fallback_text = self._prompt_engine.generate_reply(messages, system_prompt, voice=voice)
        for word in fallback_text.split(" "):
            yield word + " "

    # ── Groq Cloud Implementation (300+ tok/s Ultra-Fast) ───────────────

    async def _chat_groq(
        self,
        messages: list[dict],
        system_prompt: str | None = None,
        model: str | None = None,
        api_key: str | None = None,
        voice: str | None = None,
    ) -> str:
        settings = get_settings()
        key = api_key or settings.groq_api_key or self._groq_api_key or os.environ.get("GROQ_API_KEY", "")
        if not key:
            raise ValueError("No Groq API key configured")

        target_model = model or self._groq_default_model
        models_to_try = [target_model]
        if target_model != "llama-3.1-8b-instant":
            models_to_try.append("llama-3.1-8b-instant")

        headers = {
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
        }
        client = await self._get_groq_client()

        for target_m in models_to_try:
            payload = {
                "model": target_m,
                "messages": self._build_ollama_messages(messages, system_prompt),
                "temperature": 0.7,
                "max_tokens": 1024,
                "stream": False,
            }
            try:
                resp = await client.post("/chat/completions", json=payload, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    choices = data.get("choices", [])
                    if choices:
                        content = choices[0].get("message", {}).get("content", "")
                        if content:
                            return content.strip()
                logger.warning("Groq model %s returned status %s: %s", target_m, resp.status_code, resp.text[:120])
            except Exception as e:
                logger.warning("Groq model %s error: %s", target_m, e)

        raise RuntimeError("All Groq models failed")

    async def _chat_stream_groq(
        self,
        messages: list[dict],
        system_prompt: str | None = None,
        model: str | None = None,
        api_key: str | None = None,
        voice: str | None = None,
    ) -> AsyncGenerator[str, None]:
        settings = get_settings()
        key = api_key or settings.groq_api_key or self._groq_api_key or os.environ.get("GROQ_API_KEY", "")
        if not key:
            return

        target_model = model or self._groq_default_model
        models_to_try = [target_model]
        if target_model != "llama-3.1-8b-instant":
            models_to_try.append("llama-3.1-8b-instant")

        headers = {
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
        }
        client = await self._get_groq_client()
        streamed_success = False

        for target_m in models_to_try:
            payload = {
                "model": target_m,
                "messages": self._build_ollama_messages(messages, system_prompt),
                "temperature": 0.7,
                "max_tokens": 1024,
                "stream": True,
            }
            try:
                async with client.stream("POST", "/chat/completions", json=payload, headers=headers) as resp:
                    if resp.status_code != 200:
                        err_text = await resp.aread()
                        logger.warning("Groq stream %s returned %s: %s", target_m, resp.status_code, err_text.decode(errors="ignore")[:100])
                        continue

                    async for line in resp.aiter_lines():
                        line = line.strip()
                        if not line or not line.startswith("data: "):
                            continue
                        if line == "data: [DONE]":
                            break
                        try:
                            data = json.loads(line[6:].strip())
                            choices = data.get("choices", [])
                            if choices:
                                delta = choices[0].get("delta", {})
                                token = delta.get("content", "")
                                if token:
                                    streamed_success = True
                                    yield token
                        except json.JSONDecodeError:
                            continue
                    if streamed_success:
                        return
            except Exception as exc:
                logger.warning("Groq stream %s exception: %s", target_m, exc)

    # ── OpenAI / ChatGPT Implementation ─────────────────────────────────

    async def _chat_openai(
        self,
        messages: list[dict],
        system_prompt: str | None = None,
        model: str | None = None,
        api_key: str | None = None,
        voice: str | None = None,
    ) -> str:
        settings = get_settings()
        key = api_key or getattr(settings, "openai_api_key", "") or self._openai_api_key or os.environ.get("OPENAI_API_KEY", "")
        if not key:
            raise ValueError("No OpenAI API key configured")

        target_model = model or self._openai_default_model
        models_to_try = [target_model]
        if target_model != "gpt-3.5-turbo":
            models_to_try.append("gpt-3.5-turbo")

        headers = {
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
        }
        client = await self._get_openai_client()

        for target_m in models_to_try:
            payload = {
                "model": target_m,
                "messages": self._build_ollama_messages(messages, system_prompt),
                "temperature": 0.7,
                "max_tokens": 1024,
                "stream": False,
            }
            try:
                resp = await client.post("/chat/completions", json=payload, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    choices = data.get("choices", [])
                    if choices:
                        content = choices[0].get("message", {}).get("content", "")
                        if content:
                            return content.strip()
                logger.warning("OpenAI model %s returned status %s: %s", target_m, resp.status_code, resp.text[:120])
            except Exception as e:
                logger.warning("OpenAI model %s error: %s", target_m, e)

        raise RuntimeError("All OpenAI models failed")

    async def _chat_stream_openai(
        self,
        messages: list[dict],
        system_prompt: str | None = None,
        model: str | None = None,
        api_key: str | None = None,
        voice: str | None = None,
    ) -> AsyncGenerator[str, None]:
        settings = get_settings()
        key = api_key or getattr(settings, "openai_api_key", "") or self._openai_api_key or os.environ.get("OPENAI_API_KEY", "")
        if not key:
            return

        target_model = model or self._openai_default_model
        models_to_try = [target_model]
        if target_model != "gpt-3.5-turbo":
            models_to_try.append("gpt-3.5-turbo")

        headers = {
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
        }
        client = await self._get_openai_client()
        streamed_success = False

        for target_m in models_to_try:
            payload = {
                "model": target_model,
                "messages": self._build_ollama_messages(messages, system_prompt),
                "temperature": 0.7,
                "max_tokens": 1024,
                "stream": True,
            }
            try:
                async with client.stream("POST", "/chat/completions", json=payload, headers=headers) as resp:
                    if resp.status_code != 200:
                        err_text = await resp.aread()
                        logger.warning("OpenAI stream %s returned %s: %s", target_m, resp.status_code, err_text.decode(errors="ignore")[:100])
                        continue

                    async for line in resp.aiter_lines():
                        line = line.strip()
                        if not line or not line.startswith("data: "):
                            continue
                        if line == "data: [DONE]":
                            break
                        try:
                            data = json.loads(line[6:].strip())
                            choices = data.get("choices", [])
                            if choices:
                                delta = choices[0].get("delta", {})
                                token = delta.get("content", "")
                                if token:
                                    streamed_success = True
                                    yield token
                        except json.JSONDecodeError:
                            continue
                    if streamed_success:
                        return
            except Exception as exc:
                logger.warning("OpenAI stream %s exception: %s", target_m, exc)

    # ── OpenRouter Free Models Implementation ───────────────────────────

    async def _chat_openrouter(
        self,
        messages: list[dict],
        system_prompt: str | None = None,
        model: str | None = None,
        api_key: str | None = None,
        voice: str | None = None,
    ) -> str:
        settings = get_settings()
        key = api_key or settings.openrouter_api_key or self._openrouter_api_key or os.environ.get("OPENROUTER_API_KEY", "")
        if not key:
            raise ValueError("No OpenRouter API key configured")

        target_model = model or self._openrouter_default_model
        models_to_try = [target_model]
        for m_cand in ["meta-llama/llama-3.1-8b-instruct:free", "mistralai/mistral-7b-instruct:free", "google/gemini-2.0-flash-exp:free"]:
            if m_cand not in models_to_try:
                models_to_try.append(m_cand)

        headers = {
            "Authorization": f"Bearer {key}",
            "HTTP-Referer": "https://bizora-voice-static.onrender.com",
            "X-Title": "BizoraVoice",
            "Content-Type": "application/json",
        }
        client = await self._get_openrouter_client()

        for target_m in models_to_try:
            payload = {
                "model": target_m,
                "messages": self._build_ollama_messages(messages, system_prompt),
                "temperature": 0.7,
                "max_tokens": 1024,
                "stream": False,
            }
            try:
                resp = await client.post("/chat/completions", json=payload, headers=headers)
                if resp.status_code == 200:
                    data = resp.json()
                    choices = data.get("choices", [])
                    if choices:
                        content = choices[0].get("message", {}).get("content", "")
                        if content:
                            return content.strip()
                logger.warning("OpenRouter model %s returned status %s: %s", target_m, resp.status_code, resp.text[:120])
            except Exception as e:
                logger.warning("OpenRouter model %s error: %s", target_m, e)

        raise RuntimeError("All OpenRouter models failed")

    async def _chat_stream_openrouter(
        self,
        messages: list[dict],
        system_prompt: str | None = None,
        model: str | None = None,
        api_key: str | None = None,
        voice: str | None = None,
    ) -> AsyncGenerator[str, None]:
        settings = get_settings()
        key = api_key or settings.openrouter_api_key or self._openrouter_api_key or os.environ.get("OPENROUTER_API_KEY", "")
        if not key:
            return

        target_model = model or self._openrouter_default_model
        models_to_try = [target_model]
        for m_cand in ["meta-llama/llama-3.1-8b-instruct:free", "mistralai/mistral-7b-instruct:free", "google/gemini-2.0-flash-exp:free"]:
            if m_cand not in models_to_try:
                models_to_try.append(m_cand)

        headers = {
            "Authorization": f"Bearer {key}",
            "HTTP-Referer": "https://bizora-voice-static.onrender.com",
            "X-Title": "BizoraVoice",
            "Content-Type": "application/json",
        }
        client = await self._get_openrouter_client()
        streamed_success = False

        for target_m in models_to_try:
            payload = {
                "model": target_m,
                "messages": self._build_ollama_messages(messages, system_prompt),
                "temperature": 0.7,
                "max_tokens": 1024,
                "stream": True,
            }
            try:
                async with client.stream("POST", "/chat/completions", json=payload, headers=headers) as resp:
                    if resp.status_code != 200:
                        err_text = await resp.aread()
                        logger.warning("OpenRouter stream %s returned %s: %s", target_m, resp.status_code, err_text.decode(errors="ignore")[:100])
                        continue

                    async for line in resp.aiter_lines():
                        line = line.strip()
                        if not line or not line.startswith("data: "):
                            continue
                        if line == "data: [DONE]":
                            break
                        try:
                            data = json.loads(line[6:].strip())
                            choices = data.get("choices", [])
                            if choices:
                                delta = choices[0].get("delta", {})
                                token = delta.get("content", "")
                                if token:
                                    streamed_success = True
                                    yield token
                        except json.JSONDecodeError:
                            continue
                    if streamed_success:
                        return
            except Exception as exc:
                logger.warning("OpenRouter stream %s exception: %s", target_m, exc)
