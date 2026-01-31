import React from 'react';
import { View, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Screen, Text } from '../components';
import { CourseCard } from '../components/features';
import { useCourses } from '../services/mockData';
import { colorValues } from '../utils/design-tokens';
import { RootStackParamList, StackRoutes } from '../types/navigation';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function CourseScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { courses, loading } = useCourses();
  const [searchText, setSearchText] = React.useState('');
  const [selectedSchool, setSelectedSchool] = React.useState<string | null>(null);

  // Extrai escolas únicas dos cursos
  const schools = React.useMemo(() => {
    const uniqueSchools = Array.from(new Set(courses.map(course => course.schoolName)));
    return uniqueSchools.sort();
  }, [courses]);

  // Filtra cursos com base na busca e escola selecionada
  const filteredCourses = React.useMemo(() => {
    return courses.filter(course => {
      const matchesSearch = searchText === '' || 
        course.programName.toLowerCase().includes(searchText.toLowerCase()) ||
        course.schoolName.toLowerCase().includes(searchText.toLowerCase());
      
      const matchesSchool = !selectedSchool || course.schoolName === selectedSchool;
      
      return matchesSearch && matchesSchool;
    });
  }, [courses, searchText, selectedSchool]);

  const handleCoursePress = (id: string) => {
    navigation.navigate(StackRoutes.COURSE_DETAIL, { courseId: id });
  };

  const handleSchoolFilter = () => {
    console.log('Open school filter modal');
    // TODO: Implementar modal de seleção de escola
  };

  const clearSchoolFilter = () => {
    setSelectedSchool(null);
  };

  if (loading) {
    return (
      <Screen safeArea={true}>
        <View className="flex-1 items-center justify-center">
          <Text variant="body" className="text-textSecondary">
            Loading...
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen safeArea={true} scrollable={true}>
      {/* Header */}
      <View className="px-4 pt-4 pb-3 gap-3">
        <View className="flex-row items-center justify-between">
          <Text variant="h1" className="text-2xl font-bold">
            Courses
          </Text>

          <TouchableOpacity
            onPress={() => console.log('Notifications')}
            activeOpacity={0.7}
            className="p-2"
          >
            <Ionicons name="notifications-outline" size={24} color={colorValues.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center gap-2 bg-surface px-4 py-3 rounded-xl">
          <Ionicons name="search-outline" size={20} color={colorValues.textMuted} />
          <TextInput
            placeholder="Search courses or schools..."
            placeholderTextColor={colorValues.textMuted}
            value={searchText}
            onChangeText={setSearchText}
            className="flex-1 text-base text-textPrimary"
          />
          {searchText !== '' && (
            <TouchableOpacity onPress={() => setSearchText('')} activeOpacity={0.7}>
              <Ionicons name="close-circle" size={20} color={colorValues.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* School Filter */}
        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            onPress={handleSchoolFilter}
            activeOpacity={0.7}
            className="flex-row items-center gap-2 bg-surface px-4 py-3 rounded-xl flex-1"
          >
            <Ionicons name="school-outline" size={20} color={colorValues.textMuted} />
            <Text variant="body" className="text-textMuted flex-1">
              {selectedSchool || 'All Schools'}
            </Text>
            <Ionicons name="chevron-down" size={16} color={colorValues.textMuted} />
          </TouchableOpacity>

          {selectedSchool && (
            <TouchableOpacity
              onPress={clearSchoolFilter}
              activeOpacity={0.7}
              className="bg-surface p-3 rounded-xl"
            >
              <Ionicons name="close" size={24} color={colorValues.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Results Count */}
      <View className="px-4 py-2">
        <Text variant="body" className="text-textSecondary">
          {filteredCourses.length} {filteredCourses.length === 1 ? 'course' : 'courses'} found
        </Text>
      </View>

      {/* Course List */}
      <View className="px-4 pb-4">
        {filteredCourses.length === 0 ? (
          <View className="py-12 items-center">
            <Ionicons name="search-outline" size={48} color={colorValues.textMuted} />
            <Text variant="body" className="text-textMuted mt-4 text-center">
              No courses found.{'\n'}Try adjusting your search or filters.
            </Text>
          </View>
        ) : (
          filteredCourses.map((course) => (
            <CourseCard
              key={course.id}
              id={course.id}
              schoolName={course.schoolName}
              programName={course.programName}
              weeklyHours={course.weeklyHours}
              priceCad={course.priceCad}
              rating={course.rating}
              ratingCount={course.ratingCount}
              isPartner={course.isPartner}
              badge={course.badge}
              image={course.image}
              onPress={() => handleCoursePress(course.id)}
            />
          ))
        )}
      </View>
    </Screen>
  );
}
