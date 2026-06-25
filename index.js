// Patched before expo-router loads. Expo dev tools call useKeepAwake on Android
// before the Activity is ready during reload, which rejects with "Unable to activate keep awake".
if (typeof __DEV__ !== 'undefined' && __DEV__) {
  try {
    const keepAwake = require('expo-keep-awake');
    const activate = keepAwake.activateKeepAwakeAsync;
    if (typeof activate === 'function' && !activate.__letiPatched) {
      keepAwake.activateKeepAwakeAsync = async (tag) => {
        try {
          await activate(tag);
        } catch {
          // Activity not ready yet during dev startup/reload.
        }
      };
      keepAwake.activateKeepAwakeAsync.__letiPatched = true;
    }
  } catch {
    // expo-keep-awake unavailable
  }
}

require('expo-router/entry');
