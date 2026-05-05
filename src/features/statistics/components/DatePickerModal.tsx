import { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, Text, TouchableOpacity, View } from "react-native";
import dayjs from "dayjs";

import { createStatisticsStyles } from "../styles";
import { useTheme } from "../../../store/themeStore";
import { useI18n } from "../../../i18n";

const WEEK_DAYS = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"];

type Props = {
  visible: boolean;
  title: string;
  selectedDate: string;
  onClose: () => void;
  onConfirm: (date: string) => void;
};

export function DatePickerModal({
  visible,
  title,
  selectedDate,
  onClose,
  onConfirm,
}: Props) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStatisticsStyles(colors), [colors]);
  const [draftDate, setDraftDate] = useState(selectedDate);
  const [currentMonth, setCurrentMonth] = useState(() =>
    dayjs(selectedDate).startOf("month"),
  );

  useEffect(() => {
    if (!visible) return;

    setDraftDate(selectedDate);
    setCurrentMonth(dayjs(selectedDate).startOf("month"));
  }, [selectedDate, visible]);

  const days = useMemo(() => {
    const monthStart = currentMonth.startOf("month");
    const monthEnd = currentMonth.endOf("month");
    const startOffset = (monthStart.day() + 6) % 7;
    const totalCells = Math.ceil((startOffset + monthEnd.date()) / 7) * 7;

    return Array.from({ length: totalCells }, (_, index) => {
      const date = monthStart.subtract(startOffset, "day").add(index, "day");
      return {
        key: date.format("YYYY-MM-DD"),
        label: date.date(),
        isCurrentMonth: date.month() === currentMonth.month(),
        isSelected: date.format("YYYY-MM-DD") === draftDate,
      };
    });
  }, [currentMonth, draftDate]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.pickerOverlay} onPress={onClose}>
        <Pressable style={styles.pickerModal} onPress={(event) => event.stopPropagation()}>
          <Text style={styles.pickerTitle}>{title}</Text>
          <Text style={styles.pickerValue}>
            {dayjs(draftDate).format("DD MMMM YYYY")}
          </Text>

          <View style={styles.calendarHeader}>
            <TouchableOpacity
              style={styles.calendarNavButton}
              onPress={() => setCurrentMonth((prev) => prev.subtract(1, "month"))}
            >
              <Text style={styles.calendarNavText}>{"<"}</Text>
            </TouchableOpacity>

            <Text style={styles.calendarMonthLabel}>
              {currentMonth.format("MMMM YYYY")}
            </Text>

            <TouchableOpacity
              style={styles.calendarNavButton}
              onPress={() => setCurrentMonth((prev) => prev.add(1, "month"))}
            >
              <Text style={styles.calendarNavText}>{">"}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.calendarWeekRow}>
            {WEEK_DAYS.map((day) => (
              <Text key={day} style={styles.calendarWeekday}>
                {day}
              </Text>
            ))}
          </View>

          <View style={styles.calendarGrid}>
            {days.map((day) => (
              <TouchableOpacity
                key={day.key}
                style={[
                  styles.calendarDay,
                  day.isSelected ? styles.calendarDaySelected : null,
                ]}
                onPress={() => setDraftDate(day.key)}
              >
                <Text
                  style={[
                    styles.calendarDayText,
                    !day.isCurrentMonth ? styles.calendarDayTextMuted : null,
                    day.isSelected ? styles.calendarDayTextSelected : null,
                  ]}
                >
                  {day.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

           <View style={styles.pickerActions}>
             <TouchableOpacity style={styles.pickerCancel} onPress={onClose}>
               <Text style={styles.pickerCancelText}>{t("cancel")}</Text>
             </TouchableOpacity>
             <TouchableOpacity
               style={styles.pickerSave}
               onPress={() => onConfirm(draftDate)}
             >
               <Text style={styles.pickerSaveText}>{t("save")}</Text>
             </TouchableOpacity>
           </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
