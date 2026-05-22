import { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import dayjs from "dayjs";

import { createStatisticsStyles } from "../styles";
import { SPACING, FONT_SIZE, BORDER_RADIUS } from "../../../theme";
import { useTheme } from "../../../store/themeStore";
import { useI18n } from "../../../i18n";

const WEEK_DAYS = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"];

const MONTHS = [
  "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
  "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr",
];

type PickerMode = "day" | "month" | "year";

type Props = {
  visible: boolean;
  title: string;
  selectedDate: string;
  onClose: () => void;
  onConfirm: (date: string) => void;
  pickerMode?: PickerMode;
};

function generateYearRange(centerYear: number, range: number): number[] {
  const start = centerYear - range;
  const end = centerYear + range;
  const years: number[] = [];
  for (let y = start; y <= end; y++) {
    years.push(y);
  }
  return years;
}

export function DatePickerModal({
  visible,
  title,
  selectedDate,
  onClose,
  onConfirm,
  pickerMode = "day",
}: Props) {
  const { colors } = useTheme();
  const { t } = useI18n();
  const styles = useMemo(() => createStatisticsStyles(colors), [colors]);
  const [draftDate, setDraftDate] = useState(selectedDate);
  const [currentMonth, setCurrentMonth] = useState(() =>
    dayjs(selectedDate).startOf("month"),
  );
  const [viewYear, setViewYear] = useState(() => dayjs(selectedDate).year());
  const [viewDecade, setViewDecade] = useState(() => {
    const y = dayjs(selectedDate).year();
    return y - (y % 12);
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setDraftDate(selectedDate);
    setCurrentMonth(dayjs(selectedDate).startOf("month"));
    setViewYear(dayjs(selectedDate).year());
    const y = dayjs(selectedDate).year();
    setViewDecade(y - (y % 12));
  }, [selectedDate, visible]);

  const days = useMemo(() => {
    if (pickerMode !== "day") return [];
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
  }, [currentMonth, draftDate, pickerMode]);

  const years = useMemo(() => {
    if (pickerMode !== "year") return [];
    return generateYearRange(viewDecade + 6, 6);
  }, [viewDecade, pickerMode]);

  const draftYear = dayjs(draftDate).year();
  const draftMonth = dayjs(draftDate).month();

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
            {pickerMode === "day" && dayjs(draftDate).format("DD MMMM YYYY")}
            {pickerMode === "month" && dayjs(draftDate).format("MMMM YYYY")}
            {pickerMode === "year" && dayjs(draftDate).format("YYYY")}
          </Text>

          {pickerMode === "day" && (
            <>
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
            </>
          )}

          {pickerMode === "month" && (
            <>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: SPACING.md }}>
                <TouchableOpacity
                  style={{ width: 40, height: 40, borderRadius: BORDER_RADIUS.md, backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center" }}
                  onPress={() => setViewYear((prev) => prev - 1)}
                >
                  <Text style={{ fontSize: FONT_SIZE.xl, fontWeight: "700", color: colors.primary }}>{"<"}</Text>
                </TouchableOpacity>
                <Text style={{ fontSize: FONT_SIZE.md, fontWeight: "700", color: colors.text }}>
                  {viewYear}
                </Text>
                <TouchableOpacity
                  style={{ width: 40, height: 40, borderRadius: BORDER_RADIUS.md, backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center" }}
                  onPress={() => setViewYear((prev) => prev + 1)}
                >
                  <Text style={{ fontSize: FONT_SIZE.xl, fontWeight: "700", color: colors.primary }}>{">"}</Text>
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {MONTHS.map((monthName, index) => {
                  const isSelected = viewYear === draftYear && index === draftMonth;
                  return (
                    <TouchableOpacity
                      key={monthName}
                      style={{ width: "33.33%", padding: SPACING.sm }}
                      onPress={() => {
                        const newDate = dayjs(`${viewYear}-${String(index + 1).padStart(2, "0")}-01`).format("YYYY-MM-DD");
                        setDraftDate(newDate);
                      }}
                    >
                      <View style={{
                        paddingVertical: SPACING.sm,
                        borderRadius: BORDER_RADIUS.md,
                        backgroundColor: isSelected ? colors.primary : colors.surfaceSecondary,
                        alignItems: "center",
                      }}>
                        <Text style={{
                          fontSize: FONT_SIZE.sm,
                          fontWeight: "600",
                          color: isSelected ? colors.white : colors.text,
                        }}>
                          {monthName.substring(0, 4)}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

          {pickerMode === "year" && (
            <>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: SPACING.md }}>
                <TouchableOpacity
                  style={{ width: 40, height: 40, borderRadius: BORDER_RADIUS.md, backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center" }}
                  onPress={() => setViewDecade((prev) => prev - 12)}
                >
                  <Text style={{ fontSize: FONT_SIZE.xl, fontWeight: "700", color: colors.primary }}>{"<"}</Text>
                </TouchableOpacity>
                <Text style={{ fontSize: FONT_SIZE.md, fontWeight: "700", color: colors.text }}>
                  {viewDecade} - {viewDecade + 11}
                </Text>
                <TouchableOpacity
                  style={{ width: 40, height: 40, borderRadius: BORDER_RADIUS.md, backgroundColor: colors.surfaceSecondary, alignItems: "center", justifyContent: "center" }}
                  onPress={() => setViewDecade((prev) => prev + 12)}
                >
                  <Text style={{ fontSize: FONT_SIZE.xl, fontWeight: "700", color: colors.primary }}>{">"}</Text>
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
                {years.map((year) => {
                  const isSelected = year === draftYear;
                  return (
                    <TouchableOpacity
                      key={year}
                      style={{ width: "33.33%", padding: SPACING.sm }}
                      onPress={() => {
                        const newDate = dayjs(draftDate).year(year).format("YYYY-MM-DD");
                        setDraftDate(newDate);
                      }}
                    >
                      <View style={{
                        paddingVertical: SPACING.sm,
                        borderRadius: BORDER_RADIUS.md,
                        backgroundColor: isSelected ? colors.primary : colors.surfaceSecondary,
                        alignItems: "center",
                      }}>
                        <Text style={{
                          fontSize: FONT_SIZE.sm,
                          fontWeight: "600",
                          color: isSelected ? colors.white : colors.text,
                        }}>
                          {year}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </>
          )}

           <View style={styles.pickerActions}>
             <TouchableOpacity style={styles.pickerCancel} onPress={onClose}>
               <Text style={styles.pickerCancelText}>{t("cancel")}</Text>
             </TouchableOpacity>
            <TouchableOpacity
                style={styles.pickerSave}
                onPress={async () => {
                  setIsSaving(true);
                  try {
                    await onConfirm(draftDate);
                  } finally {
                    setIsSaving(false);
                  }
                }}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color={colors.white} />
                ) : (
                  <Text style={styles.pickerSaveText}>{t("save")}</Text>
                )}
              </TouchableOpacity>
           </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
