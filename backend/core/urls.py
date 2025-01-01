from django.urls import path
from .views import RegisterView, LoginView, LogoutView, UserStoriesView, UserStoryDetailView, \
    ChapterStoryView, ChracterView, GenerateStoryImageView, GenerateCharacterImageView, ChapterDetailView, CharacterDetailView, StoryGenerationView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('login/', LoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('stories/', UserStoriesView.as_view(), name='user-stories'),
    path('stories/<int:pk>/', UserStoryDetailView.as_view(),
         name='user-story-detail'),
    path('stories/<int:pk>/chapters/',
         ChapterStoryView.as_view(), name='user-story-chapters'),
    path('stories/<int:story_pk>/chapters/<int:chapter_pk>/',
         ChapterDetailView.as_view(), name='user-story-chapters-details'),
    path('stories/<int:story_pk>/characters/<int:character_pk>/',
         CharacterDetailView.as_view(), name='user-story-characters-details'),
    path('stories/<int:pk>/characters/',
         ChracterView.as_view(), name='user-story-characters'),
    path('stories/<int:pk>/generate-image/',
         GenerateStoryImageView.as_view(), name='generate-image'),
    path('characters/<int:pk>/generate-image/',
         GenerateCharacterImageView.as_view(), name='generate-character-image'),
    path('chat/', StoryGenerationView.as_view(), name='chat'),

    # path('user/<int:user_id>/stories-list/',
    #      views.stories_list, name='stories-list'),

    # path('user/<int:user_id>/stories-detail/<int:story_id>/',
    #      views.story_detail, name='story-detail'),

    # path('user/<int:user_id>/stories-detail/<int:story_id>/checkpoints/',
    #      views.story_checkpoints, name='story-checkpoints'),

    # path('user/<int:user_id>/stories-detail/<int:story_id>/checkpoints/<int:checkpoint_id>/',
    #      views.checkpoint_detail, name='checkpoint-detail'),

    # path('user/<int:user_id>/stories-detail/<int:story_id>/characters/',
    #      views.story_characters, name='story-characters'),

    # path('user/<int:user_id>/stories-detail/<int:story_id>/characters/<int:character_id>/',
    #      views.character_detail, name='character-detail'),
]
