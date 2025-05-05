import {
	View,
	Text,
	TextInput,
	StyleSheet,
	TouchableOpacity,
	Image,
	Alert,
	ActivityIndicator,
} from 'react-native';
import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { doc, getFirestore, updateDoc, getDoc } from 'firebase/firestore';
import { app } from '../config/firebase';
import * as ImagePicker from 'expo-image-picker';

export default function EditProfile() {
	const { user } = useAuth();
	const db = getFirestore(app);
	const [name, setName] = useState('');
	const [email, setEmail] = useState('');
	const [profileImage, setProfileImage] = useState('');
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		const fetchUserData = async () => {
			if (!user?.id) return;
			const docRef = doc(db, 'users', user.id);
			const userSnap = await getDoc(docRef);

			if (userSnap.exists()) {
				const data = userSnap.data();
				setName(data.name);
				setEmail(data.email);
				setProfileImage(data.profileImage || '');
			}
		};

		fetchUserData();
	}, [user?.id]);

	const handleImagePick = async () => {
		const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (permission.status !== 'granted') {
			return Alert.alert('Permission denied', 'We need camera roll permissions.');
		}

		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			allowsEditing: true,
			aspect: [1, 1],
			quality: 0.5,
		});

		if (!result.canceled && result.assets.length > 0) {
			setProfileImage(result.assets[0].uri);
		}
	};

	const handleSave = async () => {
		if (!name.trim() || !email.trim()) {
			return Alert.alert('Error', 'Name and email are required.');
		}
		setLoading(true);
		try {
			await updateDoc(doc(db, 'users', user.id), {
				name,
				email,
				profileImage,
			});
			Alert.alert('Success', 'Profile updated successfully.');
		} catch (error) {
			console.error('Error updating profile:', error);
			Alert.alert('Error', 'Failed to update profile.');
		} finally {
			setLoading(false);
		}
	};

	return (
		<View style={styles.container}>
			<TouchableOpacity onPress={handleImagePick}>
				<Image
					source={{
						uri: profileImage || 'https://via.placeholder.com/100',
					}}
					style={styles.profileImage}
				/>
				<Text style={styles.changePhoto}>Change Photo</Text>
			</TouchableOpacity>

			<TextInput
				style={styles.input}
				placeholder='Name'
				value={name}
				onChangeText={setName}
			/>

			<TextInput
				style={styles.input}
				placeholder='Email'
				value={email}
				onChangeText={setEmail}
				keyboardType='email-address'
			/>

			<TouchableOpacity
				style={styles.saveButton}
				onPress={handleSave}
				disabled={loading}
			>
				{loading ? (
					<ActivityIndicator color='#fff' />
				) : (
					<Text style={styles.saveButtonText}>Save Changes</Text>
				)}
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		padding: 20,
		backgroundColor: '#fff',
	},
	profileImage: {
		width: 100,
		height: 100,
		borderRadius: 50,
		alignSelf: 'center',
		marginBottom: 10,
	},
	changePhoto: {
		textAlign: 'center',
		color: '#4CAF50',
		marginBottom: 20,
	},
	input: {
		borderWidth: 1,
		borderColor: '#ccc',
		borderRadius: 8,
		padding: 12,
		marginBottom: 15,
		fontSize: 16,
	},
	saveButton: {
		backgroundColor: '#4CAF50',
		padding: 15,
		borderRadius: 8,
		alignItems: 'center',
	},
	saveButtonText: {
		color: '#fff',
		fontSize: 16,
		fontWeight: 'bold',
	},
});
