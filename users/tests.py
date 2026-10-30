from rest_framework.test import APITestCase
from django.contrib.auth import get_user_model
from rest_framework import status


User = get_user_model()

class CustomUserViewSetTest(APITestCase):
    def setUp(self):
        self.admin = User.objects.create_superuser(email="testa@ta.com", password="testpass123")
        self.user = User.objects.create_user(email="user@us.com", password="testpass123")
        self.url = "/api/users/customusers/"
        self.valid_payload = {
            "first_name": "New",
            "last_name": "Person",
            "email": "new@us.com",
            "password": "testpass123",
            "role": "ADMIN",
        }

    def test_anonymous_signup_ignores_admin_role(self):
        response = self.client.post(self.url, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["role"], User.Roles.USER)
        created = User.objects.get(email="new@us.com")
        self.assertEqual(created.role, User.Roles.USER)
    def test_regular_user_cannot_set_role(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.post(self.url, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        created = User.objects.get(email="new@us.com")
        self.assertEqual(created.role, User.Roles.USER)
    def test_admin_can_create_user_with_admin_role(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post(self.url, self.valid_payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        created = User.objects.get(email="new@us.com")
        self.assertEqual(created.role, User.Roles.ADMIN)
    def test_admin_can_change_user_role(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.patch(
            f"{self.url}{self.user.id}/", {"role": "ADMIN"}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.role, User.Roles.ADMIN)


class CurrentUserEndpointTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email="user@us.com", password="testpass123", first_name="Old"
        )
        self.url = "/api/users/me/"

    def test_me_returns_current_user(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], "user@us.com")
        self.assertEqual(response.data["role"], User.Roles.USER)
        self.assertNotIn("password", response.data)
    def test_me_requires_authentication(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    def test_me_patch_updates_profile_but_not_role(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.patch(
            self.url, {"first_name": "New", "role": "ADMIN"}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertEqual(self.user.first_name, "New")
        self.assertEqual(self.user.role, User.Roles.USER)
    def test_password_change_is_hashed(self):
        self.client.force_authenticate(user=self.user)
        response = self.client.patch(self.url, {"password": "newpass456"}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertNotEqual(self.user.password, "newpass456")
        self.assertTrue(self.user.check_password("newpass456"))
