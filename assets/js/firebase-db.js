/**
 * firebase-db.js - Firebase Database wrapper
 * Provides localStorage-like interface but uses Firebase Realtime Database
 */

(function() {
    'use strict';

    // Wait for Firebase to be initialized
    function waitForFirebase() {
        return new Promise((resolve) => {
            if (window.firebaseDB) {
                resolve();
            } else {
                const checkInterval = setInterval(() => {
                    if (window.firebaseDB) {
                        clearInterval(checkInterval);
                        resolve();
                    }
                }, 100);
            }
        });
    }

    // Firebase Database Helper
    const FirebaseDB = {
        /**
         * Get Avatar B messages from Firebase
         */
        async getAvatarBMessages() {
            await waitForFirebase();
            const { ref, get, database } = window.firebaseDB;
            const messagesRef = ref(database, 'avatarBMessages');
            const snapshot = await get(messagesRef);
            return snapshot.exists() ? snapshot.val() : {};
        },

        /**
         * Save a new Avatar B message to Firebase
         */
        async saveAvatarBMessages(messageText) {
            await waitForFirebase();
            const { ref, push, database } = window.firebaseDB;
            const messagesRef = ref(database, 'avatarBMessages');
            await push(messagesRef, {
                text: messageText,
                timestamp: Date.now()
            });
        },

        /**
         * Get emoji reactions from Firebase
         */
        async getEmojiReactions() {
            await waitForFirebase();
            const { ref, get, database } = window.firebaseDB;
            const reactionsRef = ref(database, 'emojiReactions');
            const snapshot = await get(reactionsRef);
            return snapshot.exists() ? snapshot.val() : {};
        },

        /**
         * Save emoji reactions to Firebase
         */
        async saveEmojiReactions(reactions) {
            await waitForFirebase();
            const { ref, set, database } = window.firebaseDB;
            const reactionsRef = ref(database, 'emojiReactions');
            await set(reactionsRef, reactions);
        },

        /**
         * Get opened days from Firebase (still use localStorage for this - it's user-specific)
         */
        getOpenedDays() {
            const openedDays = localStorage.getItem('openedDays');
            return openedDays ? JSON.parse(openedDays) : [];
        },

        /**
         * Save opened days to localStorage (user-specific data)
         */
        saveOpenedDays(days) {
            localStorage.setItem('openedDays', JSON.stringify(days));
        },

        /**
         * Listen to emoji reactions changes in real-time
         */
        async onEmojiReactionsChange(callback) {
            await waitForFirebase();
            const { ref, onValue, database } = window.firebaseDB;
            const reactionsRef = ref(database, 'emojiReactions');
            onValue(reactionsRef, (snapshot) => {
                const reactions = snapshot.exists() ? snapshot.val() : {};
                callback(reactions);
            });
        },

        /**
         * Listen to Avatar B messages changes in real-time
         */
        async onAvatarBMessagesChange(callback) {
            await waitForFirebase();
            const { ref, onValue, database } = window.firebaseDB;
            const messagesRef = ref(database, 'avatarBMessages');
            onValue(messagesRef, (snapshot) => {
                const messages = snapshot.exists() ? snapshot.val() : {};
                callback(messages);
            });
        },

        /**
         * Get location texts from Firebase
         */
        async getLocationTexts() {
            await waitForFirebase();
            const { ref, get, database } = window.firebaseDB;
            const textsRef = ref(database, 'locationTexts');
            const snapshot = await get(textsRef);
            return snapshot.exists() ? snapshot.val() : {};
        },

        /**
         * Save location texts to Firebase
         */
        async saveLocationTexts(texts) {
            await waitForFirebase();
            const { ref, set, database } = window.firebaseDB;
            const textsRef = ref(database, 'locationTexts');
            await set(textsRef, texts);
        }
    };

    // Make it available globally
    window.FirebaseDB = FirebaseDB;

})();
