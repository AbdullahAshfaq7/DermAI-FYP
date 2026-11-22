/**
 * react-native-web ships Alert.alert as a no-op, so confirm dialogs (log out, cancel a visit,
 * delete a scan) did nothing on the web build. This maps them onto the browser's own dialogs:
 * an OK-only alert, or a confirm whose OK runs the one non-cancel action.
 * Pickers with several choices use components/PickerSheet instead.
 */
import { Alert, Platform, type AlertButton } from 'react-native';

if (Platform.OS === 'web' && typeof window !== 'undefined') {
  Alert.alert = (title: string, message?: string, buttons?: AlertButton[]) => {
    const text = [title, message].filter(Boolean).join('\n\n');
    const list = buttons ?? [];
    const cancel = list.find((b) => b.style === 'cancel');
    const actions = list.filter((b) => b.style !== 'cancel');
    if (!cancel) {
      window.alert(text);
      actions[0]?.onPress?.();
      return;
    }
    if (actions.length === 0) {
      window.alert(text);
      cancel.onPress?.();
      return;
    }
    if (window.confirm(text)) actions[actions.length - 1].onPress?.();
    else cancel.onPress?.();
  };
}
