import React, { useState } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TextInput,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ArrowLeft, Calendar, Camera, FileText, Home, Mars, MapPinned, Plus, Save, User } from 'lucide-react-native';
import { Gender, Member } from '../types';
import { colors, spacing, radius } from '../constants/theme';
import { AddressMapPickerModal } from '../components/AddressMapPickerModal';

interface Props {
  initialMember?: Member; // 指定時は編集モード（未指定なら新規登録）
  onBack?: () => void;
  onSubmit?: (member: Member) => void;
}

const GENDER_OPTIONS: Gender[] = ['男性', '女性', 'その他'];

// "1957年3月15日" 形式の文字列を年・月・日に分解する
const parseBirthDate = (birthDate?: string) => {
  const match = birthDate?.match(/^(\d+)年(\d+)月(\d+)日$/);
  if (!match) return { year: '', month: '', day: '' };
  return { year: match[1], month: match[2], day: match[3] };
};

const calculateAge = (year: number, month: number, day: number): number => {
  const today = new Date();
  let age = today.getFullYear() - year;
  const hasHadBirthdayThisYear =
    today.getMonth() + 1 > month || (today.getMonth() + 1 === month && today.getDate() >= day);
  if (!hasHadBirthdayThisYear) age -= 1;
  return age;
};

/**
 * 見守りメンバの新規登録・編集画面。
 * initialMember が渡された場合は編集モードとして扱い、フォームの内容で該当メンバーを更新する。
 */
export const MemberFormScreen: React.FC<Props> = ({ initialMember, onBack, onSubmit }) => {
  const isEditMode = !!initialMember;
  const initialBirthDate = parseBirthDate(initialMember?.birthDate);

  const [name, setName] = useState(initialMember?.name ?? '');
  const [birthYear, setBirthYear] = useState(initialBirthDate.year);
  const [birthMonth, setBirthMonth] = useState(initialBirthDate.month);
  const [birthDay, setBirthDay] = useState(initialBirthDate.day);
  const [gender, setGender] = useState<Gender>(initialMember?.gender ?? '男性');
  const [homeAddress, setHomeAddress] = useState(initialMember?.homeAddress ?? '');
  const [notes, setNotes] = useState(initialMember?.notes ?? '');
  const [photoUri, setPhotoUri] = useState(initialMember?.photoUrl);
  const [mapPickerVisible, setMapPickerVisible] = useState(false);

  const yearNumber = Number(birthYear);
  const monthNumber = Number(birthMonth);
  const dayNumber = Number(birthDay);
  const isBirthDateValid =
    birthYear.trim() !== '' &&
    birthMonth.trim() !== '' &&
    birthDay.trim() !== '' &&
    !Number.isNaN(yearNumber) &&
    monthNumber >= 1 &&
    monthNumber <= 12 &&
    dayNumber >= 1 &&
    dayNumber <= 31;
  const isValid = name.trim() !== '' && isBirthDateValid;

  const handleTakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('権限がありません', 'カメラへのアクセスが許可されていません。端末の設定から許可してください。');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handlePickFromLibrary = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('権限がありません', '写真ライブラリへのアクセスが許可されていません。端末の設定から許可してください。');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const handlePickPhoto = () => {
    Alert.alert('写真を追加', '取得方法を選んでください。', [
      { text: 'カメラで撮影', onPress: handleTakePhoto },
      { text: 'アルバムから選択', onPress: handlePickFromLibrary },
      { text: 'キャンセル', style: 'cancel' },
    ]);
  };

  const handleSave = () => {
    if (!isValid) {
      Alert.alert('入力エラー', '名前と生年月日（※必須項目）を正しく入力してください。');
      return;
    }

    const age = calculateAge(yearNumber, monthNumber, dayNumber);
    const birthDate = `${yearNumber}年${monthNumber}月${dayNumber}日`;

    const member: Member = isEditMode
      ? {
          ...initialMember!,
          name: name.trim(),
          age,
          birthDate,
          gender,
          homeAddress: homeAddress.trim() || undefined,
          notes: notes.trim() || undefined,
          photoUrl: photoUri,
        }
      : {
          id: `member-${Date.now()}`,
          name: name.trim(),
          age,
          birthDate,
          gender,
          homeAddress: homeAddress.trim() || undefined,
          notes: notes.trim() || undefined,
          photoUrl: photoUri,
          location: {
            address: homeAddress.trim() || '住所未設定',
            latitude: 35.681236,
            longitude: 139.767125,
          },
          environment: { temperature: 0, humidity: 0 },
          riskLevel: 'safeLight',
          lastUpdated: '—',
          isResting: false,
        };

    onSubmit?.(member);
    Alert.alert(
      isEditMode ? '保存しました' : '登録しました',
      isEditMode
        ? `${name}さんの情報を更新しました。`
        : `${name}さんを見守りメンバに登録しました。`,
      [{ text: 'OK', onPress: () => onBack?.() }]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} hitSlop={8}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{isEditMode ? 'メンバ編集' : 'メンバ登録'}</Text>
        <TouchableOpacity onPress={handleSave} hitSlop={8}>
          <Text style={styles.saveLink}>保存</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.description}>
          {isEditMode ? '見守り対象のメンバ情報を編集します。' : '見守り対象のメンバ情報を登録します。'}
        </Text>
        <Text style={styles.requiredNote}>（※は必須項目です）</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>写真</Text>
          <TouchableOpacity style={styles.photoWrapper} activeOpacity={0.7} onPress={handlePickPhoto}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.photoImage} />
            ) : (
              <View style={styles.photoCircle}>
                <Camera size={28} color={colors.textSecondary} />
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.photoAddText} onPress={handlePickPhoto}>
            {photoUri ? '写真を変更' : '写真を追加'}
          </Text>
          <Text style={styles.photoCaption}>※カメラ撮影・アルバムどちらからも選べます</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>基本情報</Text>

          <View style={styles.row}>
            <User size={18} color={colors.textSecondary} style={styles.rowIcon} />
            <Text style={styles.rowLabel}>
              名前 <Text style={styles.required}>※</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="例）山田 太郎"
              placeholderTextColor={colors.textSecondary}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.row}>
            <Calendar size={18} color={colors.textSecondary} style={styles.rowIcon} />
            <Text style={styles.rowLabel}>
              生年月日 <Text style={styles.required}>※</Text>
            </Text>
            <View style={styles.birthDateGroup}>
              <TextInput
                style={[styles.input, styles.birthDateInputYear]}
                placeholder="1957"
                placeholderTextColor={colors.textSecondary}
                value={birthYear}
                onChangeText={setBirthYear}
                keyboardType="number-pad"
                maxLength={4}
              />
              <Text style={styles.unitText}>年</Text>
              <TextInput
                style={[styles.input, styles.birthDateInputSmall]}
                placeholder="3"
                placeholderTextColor={colors.textSecondary}
                value={birthMonth}
                onChangeText={setBirthMonth}
                keyboardType="number-pad"
                maxLength={2}
              />
              <Text style={styles.unitText}>月</Text>
              <TextInput
                style={[styles.input, styles.birthDateInputSmall]}
                placeholder="15"
                placeholderTextColor={colors.textSecondary}
                value={birthDay}
                onChangeText={setBirthDay}
                keyboardType="number-pad"
                maxLength={2}
              />
              <Text style={styles.unitText}>日</Text>
            </View>
          </View>

          <View style={styles.row}>
            <Mars size={18} color={colors.textSecondary} style={styles.rowIcon} />
            <Text style={styles.rowLabel}>性別</Text>
            <View style={styles.genderGroup}>
              {GENDER_OPTIONS.map((option) => {
                const selected = option === gender;
                return (
                  <TouchableOpacity
                    key={option}
                    style={[styles.genderOption, selected && styles.genderOptionSelected]}
                    activeOpacity={0.7}
                    onPress={() => setGender(option)}>
                    <Text style={[styles.genderOptionText, selected && styles.genderOptionTextSelected]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={[styles.row, styles.rowLast]}>
            <Home size={18} color={colors.textSecondary} style={styles.rowIcon} />
            <Text style={styles.rowLabel}>自宅住所</Text>
            <TextInput
              style={styles.input}
              placeholder="例）東京都千代田区丸の内1-1-1"
              placeholderTextColor={colors.textSecondary}
              value={homeAddress}
              onChangeText={setHomeAddress}
            />
            <TouchableOpacity
              style={styles.mapPickButton}
              activeOpacity={0.7}
              onPress={() => setMapPickerVisible(true)}>
              <MapPinned size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
          <Text style={styles.mapPickHint}>※入力のほか、地図でピンをさして決めることもできます</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            備考 <Text style={styles.optionalNote}>（任意）</Text>
          </Text>
          <View style={styles.textAreaRow}>
            <FileText size={18} color={colors.textSecondary} style={styles.rowIcon} />
            <TextInput
              style={styles.textArea}
              placeholder="例）その他メモなど"
              placeholderTextColor={colors.textSecondary}
              value={notes}
              onChangeText={setNotes}
              multiline
            />
          </View>
        </View>

        <TouchableOpacity style={styles.submitButton} activeOpacity={0.8} onPress={handleSave}>
          {isEditMode ? (
            <Save size={18} color="#FFFFFF" />
          ) : (
            <Plus size={18} color="#FFFFFF" />
          )}
          <Text style={styles.submitButtonText}>
            {isEditMode ? '　保存する' : '　登録する'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <AddressMapPickerModal
        visible={mapPickerVisible}
        onClose={() => setMapPickerVisible(false)}
        onConfirm={(address) => {
          setHomeAddress(address);
          setMapPickerVisible(false);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  saveLink: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  description: {
    fontSize: 13,
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  requiredNote: {
    fontSize: 12,
    color: colors.bannerText,
    marginTop: 4,
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.cardBackground,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  optionalNote: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  photoWrapper: {
    alignItems: 'center',
  },
  photoCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  photoAddText: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '600',
    color: colors.textPrimary,
    marginTop: spacing.sm,
  },
  photoCaption: {
    textAlign: 'center',
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  rowLast: {
    marginBottom: spacing.xs,
  },
  rowIcon: {
    marginRight: spacing.sm,
  },
  rowLabel: {
    width: 72,
    fontSize: 13,
    color: colors.textPrimary,
  },
  required: {
    color: colors.bannerText,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    fontSize: 13,
    color: colors.textPrimary,
  },
  birthDateGroup: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  birthDateInputYear: {
    flex: 0,
    width: 64,
    marginRight: 4,
  },
  birthDateInputSmall: {
    flex: 0,
    width: 44,
    marginLeft: spacing.xs,
    marginRight: 4,
  },
  unitText: {
    fontSize: 13,
    color: colors.textPrimary,
  },
  mapPickButton: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
  },
  mapPickHint: {
    fontSize: 11,
    color: colors.textSecondary,
    marginLeft: 72 + 18 + spacing.sm,
  },
  genderGroup: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
  },
  genderOption: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  genderOptionSelected: {
    backgroundColor: colors.restBackground,
    borderColor: colors.primary,
  },
  genderOptionText: {
    fontSize: 13,
    color: colors.textPrimary,
  },
  genderOptionTextSelected: {
    color: colors.primary,
    fontWeight: '700',
  },
  textAreaRow: {
    flexDirection: 'row',
  },
  textArea: {
    flex: 1,
    minHeight: 72,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    fontSize: 13,
    color: colors.textPrimary,
    textAlignVertical: 'top',
  },
  submitButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
