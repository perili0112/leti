// app/(tabs)/ai.tsx — Leti AI chat screen (theme-aware)

import React, { useState, useRef, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { X, Clock, Plus, Send } from 'lucide-react-native';
import { FontFamily, Spacing, Radius, type ColorPalette } from '../../constants/theme';
import { useTheme } from '../../constants/ThemeContext';
import { LetiMark } from '../components/LetiLogo';

type Message  = { id: string; role: 'user' | 'ai'; text: string; time: string };
type ChatItem = { id: string; title: string; date: string; starred: boolean; unread?: boolean; trash?: boolean; trashExpiry?: string };

const SUGGESTED_PROMPTS = ['Why was last week tiring?', 'Am I ready to race?'];

const MOCK_CHATS: ChatItem[] = [
  { id: '1', title: 'Marathon build — is my pace right?', date: 'Wed 28 May 2025', starred: true },
  { id: '2', title: 'Knee pain after long runs',           date: 'Sat 10 May 2025', starred: true },
  { id: '3', title: 'Should I add a tempo this week?',     date: 'Thu 5 Jun 2025',  starred: false },
  { id: '4', title: "Your easy run wasn't easy",           date: 'Today · 2 hrs ago', starred: false, unread: true },
  { id: '5', title: 'Race day taper questions',             date: 'Mon 2 Jun 2025',  starred: false },
  { id: '6', title: "Morning run — how'd I do?",           date: '28 May', starred: false, trash: true, trashExpiry: 'Expires 4 Jun · tap to restore' },
];

function generateAIResponse(msg: string): string {
  const l = msg.toLowerCase();
  if (l.includes('tired') || l.includes('last week')) return "Last week you ran 42 km across 5 sessions — that's 18% above your recent average. Your long run on Saturday was 14 km which pushed your weekly load over the threshold. A recovery day this week will help you absorb the training.";
  if (l.includes('race') || l.includes('ready')) return "Based on your last 4 weeks of training, you're tracking well for your race goal. Your longest run is 14 km, your average pace has improved by 8 seconds per km, and your weekly mileage is building steadily. I'd say you're on track — trust the plan.";
  if (l.includes('tempo') || l.includes('speed')) return "Looking at this week's plan, you already have a tempo session on Thursday. Adding another this week would put you at risk of overloading. I'd keep to the plan and save extra intensity for next week.";
  if (l.includes('pace')) return "Your current easy run pace of 5:45–6:00/km is right where it should be for Zone 2. The key is keeping it conversational — if you can't hold a sentence, slow down.";
  return "That's a great question. Based on your training data over the last 4 weeks, everything is looking positive. Your consistency has been strong — 4 runs per week on average — and your pace is gradually improving. Keep following the plan.";
}

// ── HISTORY PANEL ────────────────────────────────────────────

function HistoryPanel({ onClose, onSelect, C }: { onClose: () => void; onSelect: (c: ChatItem) => void; C: ColorPalette }) {
  const starred = MOCK_CHATS.filter(c => c.starred);
  const recent  = MOCK_CHATS.filter(c => !c.starred && !c.trash);
  const trash   = MOCK_CHATS.filter(c => c.trash);

  return (
    <View style={[hp.overlay]}>
      <TouchableOpacity style={hp.scrim} onPress={onClose} activeOpacity={1} />
      <SafeAreaView style={[hp.panel, { backgroundColor: C.bg }]} edges={['top', 'bottom']}>
        <View style={[hp.header, { borderBottomColor: C.border }]}>
          <Text style={[hp.headerTitle, { color: C.textPrimary }]}>Chats</Text>
          <TouchableOpacity style={[hp.closeBtn, { backgroundColor: C.card, borderColor: C.borderMedium }]} onPress={onClose} activeOpacity={0.7}>
            <X size={13} color={C.textSecondary} />
          </TouchableOpacity>
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={[hp.sectionHeader, { backgroundColor: C.bg }]}>
            <Text style={[hp.sectionLabel, { color: C.accent }]}>★  Starred</Text>
          </View>
          {starred.map(chat => (
            <TouchableOpacity key={chat.id} style={[hp.chatRow, { backgroundColor: C.card, borderBottomColor: C.border }]} onPress={() => { onSelect(chat); onClose(); }} activeOpacity={0.7}>
              <View style={{ flex: 1 }}>
                <Text style={[hp.chatTitle, { color: C.textPrimary }]} numberOfLines={1}>{chat.title}</Text>
                <Text style={[hp.chatDate, { color: C.textMuted }]}>{chat.date}</Text>
              </View>
              <Text style={{ fontSize: 14, color: C.accent }}>★</Text>
            </TouchableOpacity>
          ))}
          <View style={[hp.sectionHeader, { backgroundColor: C.bg }]}>
            <Text style={[hp.sectionLabel, { color: C.textMuted }]}>Recent</Text>
          </View>
          {recent.map(chat => (
            <TouchableOpacity key={chat.id} style={[hp.chatRow, { backgroundColor: C.card, borderBottomColor: C.border }]} onPress={() => { onSelect(chat); onClose(); }} activeOpacity={0.7}>
              {chat.unread && <View style={[hp.unreadDot, { backgroundColor: C.primary }]} />}
              <View style={{ flex: 1 }}>
                <Text style={[hp.chatTitle, { color: C.textPrimary }, chat.unread && { fontFamily: FontFamily.uiSemiBold }]} numberOfLines={1}>{chat.title}</Text>
                <Text style={[hp.chatDate, { color: chat.unread ? C.textSecondary : C.textMuted }]}>{chat.date}</Text>
              </View>
            </TouchableOpacity>
          ))}
          <View style={[hp.sectionHeader, { backgroundColor: C.bg }]}>
            <Text style={[hp.sectionLabel, { color: C.textTertiary }]}>Trash</Text>
          </View>
          {trash.map(chat => (
            <View key={chat.id} style={[hp.trashRow, { borderColor: C.borderMedium, backgroundColor: C.cardAlt }]}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                <Text style={[hp.trashTitle, { color: C.textMuted }]} numberOfLines={1}>{chat.title}</Text>
                <Text style={[hp.trashDate, { color: C.textTertiary }]}>{chat.date}</Text>
              </View>
              <Text style={[{ fontFamily: FontFamily.uiRegular, fontSize: 11, color: C.textTertiary }]}>{chat.trashExpiry}</Text>
            </View>
          ))}
          <View style={{ height: 24 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

// ── AI SCREEN ────────────────────────────────────────────────

export default function AIScreen() {
  const { colors: C, isDark } = useTheme();
  const [messages,     setMessages]     = useState<Message[]>([]);
  const [input,        setInput]        = useState('');
  const [showHistory,  setShowHistory]  = useState(false);
  const [isTyping,     setIsTyping]     = useState(false);
  const scrollRef = useRef<ScrollView>(null);
  const hasMessages = messages.length > 0;
  const s = useMemo(() => makeStyles(C), [C]);

  const sendMessage = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: trimmed, time: 'Just now' }]);
    setInput('');
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { id: (Date.now()+1).toString(), role: 'ai', text: generateAIResponse(trimmed), time: 'Just now' }]);
      setIsTyping(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }, 1200);
  }, []);

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View style={s.topBar}>
        <TouchableOpacity style={s.historyBtn} onPress={() => setShowHistory(true)} activeOpacity={0.7}>
          <Clock size={18} color={C.textSecondary} />
        </TouchableOpacity>
        <Text style={s.topBarTitle}>Leti AI</Text>
        {hasMessages ? (
          <TouchableOpacity style={s.historyBtn} onPress={() => { setMessages([]); setInput(''); }} activeOpacity={0.7}>
            <Plus size={20} color={C.textSecondary} />
          </TouchableOpacity>
        ) : <View style={{ width: 38 }} />}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {!hasMessages ? (
          <View style={s.emptyWrap}>
            <View style={s.emptyIcon}>
              <LetiMark size={28} />
            </View>
            <Text style={s.emptyText}>Ask Leti anything about your training.</Text>
          </View>
        ) : (
          <ScrollView ref={scrollRef} style={{ flex: 1 }} contentContainerStyle={s.messagesContent} showsVerticalScrollIndicator={false} onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
            {messages.map(msg => (
              <View key={msg.id} style={[s.bubble, msg.role === 'user' ? s.bubbleUser : s.bubbleAI]}>
                {msg.role === 'ai' && <View style={s.aiAvatarSmall}><LetiMark size={14} variant="white" /></View>}
                <View style={[s.bubbleText, msg.role === 'user' ? s.bubbleTextUser : s.bubbleTextAI]}>
                  <Text style={msg.role === 'user' ? s.msgTextUser : s.msgTextAI}>{msg.text}</Text>
                </View>
              </View>
            ))}
            {isTyping && (
              <View style={[s.bubble, s.bubbleAI]}>
                <View style={s.aiAvatarSmall}><LetiMark size={14} variant="white" /></View>
                <View style={s.bubbleTextAI}><Text style={s.typingDots}>· · ·</Text></View>
              </View>
            )}
          </ScrollView>
        )}

        {!hasMessages && (
          <View style={s.promptsCard}>
            <Text style={s.promptsLabel}>Try asking</Text>
            {SUGGESTED_PROMPTS.map(p => (
              <TouchableOpacity key={p} style={s.promptRow} onPress={() => sendMessage(p)} activeOpacity={0.7}>
                <Text style={s.promptText}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={s.inputBar}>
          <TextInput
            style={s.input}
            value={input}
            onChangeText={setInput}
            placeholder="Message Leti..."
            placeholderTextColor={C.textTertiary}
            returnKeyType="send"
            onSubmitEditing={() => sendMessage(input)}
            multiline={false}
          />
          <TouchableOpacity style={[s.sendBtn, input.trim().length > 0 && s.sendBtnActive]} onPress={() => sendMessage(input)} activeOpacity={0.8}>
            <Send size={16} color={input.trim().length > 0 ? '#fff' : C.textTertiary} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {showHistory && <HistoryPanel onClose={() => setShowHistory(false)} onSelect={chat => { setMessages([{ id: '1', role: 'user', text: chat.title, time: chat.date }, { id: '2', role: 'ai', text: generateAIResponse(chat.title), time: chat.date }]); }} C={C} />}
    </SafeAreaView>
  );
}

function makeStyles(C: ColorPalette) {
  return StyleSheet.create({
    safe:          { flex: 1, backgroundColor: C.bg },
    topBar:        { height: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.bg },
    topBarTitle:   { fontFamily: FontFamily.displayBold, fontSize: 18, color: C.textPrimary, letterSpacing: 0.4 },
    historyBtn:    { width: 38, height: 38, borderRadius: 10, borderWidth: 1.5, borderColor: C.borderMedium, backgroundColor: C.card, alignItems: 'center', justifyContent: 'center' },
    emptyWrap:     { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
    emptyIcon:     { width: 52, height: 52, borderRadius: 26, borderWidth: 1.5, borderColor: C.primaryFaint, backgroundColor: C.primaryFaint, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
    emptyText:     { fontFamily: FontFamily.uiRegular, fontSize: 16, color: C.textSecondary, textAlign: 'center', lineHeight: 24 },
    messagesContent: { padding: Spacing.lg, gap: Spacing.md },
    bubble:        { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginBottom: 4 },
    bubbleUser:    { justifyContent: 'flex-end' },
    bubbleAI:      { justifyContent: 'flex-start' },
    aiAvatarSmall: { width: 26, height: 26, borderRadius: 13, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginBottom: 2 },
    bubbleText:    { maxWidth: '78%', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 10 },
    bubbleTextUser: { backgroundColor: C.dark, borderBottomRightRadius: 4 },
    bubbleTextAI:  { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderBottomLeftRadius: 4 },
    msgTextUser:   { fontFamily: FontFamily.uiRegular, fontSize: 14, color: '#F5F5F0', lineHeight: 21 },
    msgTextAI:     { fontFamily: FontFamily.uiRegular, fontSize: 14, color: C.textPrimary, lineHeight: 21 },
    typingDots:    { fontFamily: FontFamily.uiBold, fontSize: 18, color: C.textMuted, letterSpacing: 4 },
    promptsCard:   { marginHorizontal: Spacing.xl, marginBottom: Spacing.sm, padding: 14, backgroundColor: C.card, borderRadius: 14, borderWidth: 1, borderColor: C.border, gap: 8 },
    promptsLabel:  { fontFamily: FontFamily.uiSemiBold, fontSize: 10, color: C.textMuted, letterSpacing: 1.2, textTransform: 'uppercase', marginBottom: 2 },
    promptRow:     { paddingVertical: 9, paddingHorizontal: 12, backgroundColor: C.bg, borderRadius: 9 },
    promptText:    { fontFamily: FontFamily.uiRegular, fontSize: 13, color: C.textSecondary },
    inputBar:      { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: Spacing.md, paddingVertical: 10, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.bg },
    input:         { flex: 1, height: 48, backgroundColor: C.card, borderWidth: 1.5, borderColor: C.borderMedium, borderRadius: 24, paddingHorizontal: 18, fontFamily: FontFamily.uiRegular, fontSize: 14, color: C.textPrimary },
    sendBtn:       { width: 48, height: 48, borderRadius: 24, backgroundColor: C.border, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
    sendBtnActive: { backgroundColor: C.primary },
  });
}

const hp = StyleSheet.create({
  overlay: { ...StyleSheet.absoluteFillObject, zIndex: 50, flexDirection: 'row' },
  scrim:   { flex: 1, backgroundColor: 'rgba(10,26,27,0.45)' },
  panel:   { position: 'absolute', top: 0, left: 0, bottom: 0, width: '68%', shadowColor: '#000', shadowOffset: { width: 4, height: 0 }, shadowOpacity: 0.16, shadowRadius: 24, elevation: 16 },
  header:  { height: 62, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, borderBottomWidth: 1 },
  headerTitle: { fontFamily: FontFamily.displayBold, fontSize: 18, letterSpacing: 0.3 },
  closeBtn:    { width: 34, height: 34, borderRadius: 9, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  sectionHeader: { paddingHorizontal: Spacing.md, paddingTop: 12, paddingBottom: 6 },
  sectionLabel:  { fontFamily: FontFamily.uiSemiBold, fontSize: 10, letterSpacing: 1.3, textTransform: 'uppercase' },
  chatRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: Spacing.md, paddingVertical: 12, borderBottomWidth: 1 },
  chatTitle: { fontFamily: FontFamily.uiRegular, fontSize: 13, marginBottom: 3 },
  chatDate:  { fontFamily: FontFamily.uiRegular, fontSize: 10.5 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0, marginTop: 1 },
  trashRow:  { marginHorizontal: 12, marginVertical: 4, padding: 12, borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 10 },
  trashTitle: { fontFamily: FontFamily.uiRegular, fontSize: 13, flex: 1 },
  trashDate:  { fontFamily: FontFamily.uiRegular, fontSize: 10 },
});