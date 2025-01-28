import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from .models import User, Story, Chapter, Character
from .serializers import UserSerializer, StorySerializer, ChapterSerializer, ComplexCharacterSerializer
from django.utils.crypto import get_random_string
import hashlib
from .authentication import TokenAuthentication
from .permission import IsAuthenticatedCustom
from openai import OpenAI
from dotenv import load_dotenv
import os
import requests
from django.core.files.base import ContentFile
from langchain_openai.chat_models import ChatOpenAI
from langchain.output_parsers import PydanticOutputParser
from langchain.text_splitter import RecursiveCharacterTextSplitter
from .expert_interview_chain import InterviewChain
from .characters_generation import CharacterGenerator
from .story_generation import StoryGenerator
from .summary_chain import StorySummarizer
from .title_selection_chain import TitleGenerator
from .story_outline_generation import StoryOutlineGenerator


load_dotenv()  # Load the .env file
api_key = os.getenv('OPENAI_API_KEY')
# User Registration View

logger = logging.getLogger(__name__)


class RegisterView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        email = request.data.get('email')
        raw_password = request.data.get('password')

        if User.objects.filter(email=email).exists():
            return Response({'error': 'Email already exists'}, status=400)

        user = User(email=email)
        hashed_password = hashlib.sha256(raw_password.encode()).hexdigest()
        user.password = hashed_password
        user.save()
        return Response({'message': 'User registered successfully'})

# User Login View


class LoginView(APIView):
    authentication_classes = []
    permission_classes = []

    def post(self, request):
        email = request.data.get('email')
        raw_password = request.data.get('password')

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'Invalid credentials'}, status=400)

        hashed_password = hashlib.sha256(raw_password.encode()).hexdigest()
        if user.password == hashed_password:
            token = get_random_string(64)
            user.token = token
            user.save()
            return Response({'token': token})
        return Response({'error': 'Invalid credentials'}, status=400)


class LogoutView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticatedCustom]

    def post(self, request):
        # Get the current user from the request
        user = request.user
        print(user)
        # Clear the user's token
        user.token = None
        user.save()

        return Response({'message': 'Successfully logged out'})

# User Stories View


class UserStoriesView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticatedCustom]

    def get(self, request):
        stories = Story.objects.filter(author=request.user)
        serializer = StorySerializer(stories, many=True)
        return Response(serializer.data)

    def post(self, request):
        title = request.data.get('title')
        genre = request.data.get('genre')
        story = Story(title=title, genre=genre, author=request.user)
        story.save()
        serializer = StorySerializer(story)
        return Response(serializer.data)


class UserStoryDetailView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticatedCustom]

    def get(self, request, pk):
        try:
            story = Story.objects.get(author=request.user, id=pk)
        except Story.DoesNotExist:
            return Response({'error': 'Story not found'}, status=404)
        serializer = StorySerializer(story)
        return Response(serializer.data)

    def delete(self, request, pk):
        try:
            story = Story.objects.get(author=request.user, id=pk)
        except Story.DoesNotExist:
            return Response({'error': 'Story not found'}, status=404)
        story.delete()
        return Response({'message': 'Story deleted successfully'})

    def patch(self, request, pk):
        try:
            story = Story.objects.get(author=request.user, id=pk)
        except Story.DoesNotExist:
            return Response({'error': 'Story not found'}, status=404)

        title = request.data.get('title', story.title)
        genre = request.data.get('genre', story.genre)

        story.title = title
        story.genre = genre
        story.save()

        serializer = StorySerializer(story)
        return Response(serializer.data)

# Chapter View


class ChapterStoryView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticatedCustom]

    def get(self, request, pk):
        try:
            story = Story.objects.get(author=request.user, id=pk)
        except Story.DoesNotExist:
            return Response({'error': 'Story not found'}, status=404)

        chapters = story.chapters.all()
        # Use the ChapterSerializer
        serializer = ChapterSerializer(chapters, many=True)
        print(serializer.data)
        return Response(serializer.data)

    def post(self, request, pk):
        try:
            story = Story.objects.get(author=request.user, id=pk)
        except Story.DoesNotExist:
            return Response({'error': 'Story not found'}, status=404)
        title = request.data.get('title')
        content = request.data.get('content')
        position = request.data.get('position')
        chapter = Chapter(title=title, content=content,
                          story=story, position=position)
        chapter.save()
        serializer = ChapterSerializer(chapter)
        return Response(serializer.data)


class ChapterDetailView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticatedCustom]

    def put(self, request, story_pk, chapter_pk):
        """
        Update a chapter's content by its ID.
        """
        try:
            chapter = Chapter.objects.get(
                id=chapter_pk, story__author=request.user)
            if chapter.story.author != request.user:
                return Response({'error': 'Permission denied'}, status=403)
        except Chapter.DoesNotExist:
            return Response({'error': 'Chapter not found'}, status=404)

        # Update fields
        # Keep existing content if not provided
        content = request.data.get('content', chapter.content)
        # Keep existing title if not provided
        title = request.data.get('title', chapter.title)

        chapter.content = content
        chapter.title = title
        chapter.save()

        serializer = ChapterSerializer(chapter)
        return Response(serializer.data)

    def delete(self, request, story_pk, chapter_pk):
        """
        Delete a chapter by its ID.
        """
        try:
            chapter = Chapter.objects.get(
                id=chapter_pk, story__author=request.user)
            if chapter.story.author != request.user:
                return Response({'error': 'Permission denied'}, status=403)
        except Chapter.DoesNotExist:
            return Response({'error': 'Chapter not found'}, status=404)

        chapter.delete()
        return Response({'message': 'Chapter deleted successfully'})

# Character View


class ChracterView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticatedCustom]

    def get(self, request, pk):
        try:
            story = Story.objects.get(author=request.user, id=pk)
        except Story.DoesNotExist:
            return Response({'error': 'Story not found'}, status=404)

        characters = story.characters.all()
        serializer = ComplexCharacterSerializer(characters, many=True)
        return Response(serializer.data)

    def post(self, request, pk):
        try:
            story = Story.objects.get(author=request.user, id=pk)
        except Story.DoesNotExist:
            return Response({'error': 'Story not found'}, status=404)
        name = request.data.get('name')
        appearance = request.data.get('appearance')
        biography = request.data.get('biography')
        character = ComplexCharacterSerializer(name=name, appearance=appearance,
                                               biography=biography, story=story)
        character.save()
        serializer = ComplexCharacterSerializer(character)
        return Response(serializer.data)


class CharacterDetailView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticatedCustom]

    def put(self, request, story_pk, character_pk):
        """
        Update a character by its ID.
        """
        try:
            character = Character.objects.get(
                id=character_pk, story=story_pk)
        except Character.DoesNotExist:
            return Response({'error': 'Character not found'}, status=404)

        # Update fields
        # Keep existing name if not provided
        logger.debug(f"story_pk: {story_pk}, character_pk: {character_pk}")
        logger.debug(f"Request Data: {request.data}")
        name = request.data.get('name', character.name)
        # Keep existing appearance if not provided
        appearance = request.data.get('appearance', character.appearance)
        # Keep existing biography if not provided
        biography = request.data.get('biography', character.biography)

        character.name = name
        character.appearance = appearance
        character.biography = biography
        character.save()

        serializer = ComplexCharacterSerializer(character)
        return Response(serializer.data)

    def delete(self, request, story_pk, character_pk):
        """
        Delete a character by its ID.
        """
        try:
            character = Character.objects.get(
                id=character_pk, story=story_pk)
        except Character.DoesNotExist:
            return Response({'error': 'Character not found'}, status=404)

        character.delete()
        return Response({'message': 'Character deleted successfully'})


class GenerateStoryImageView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticatedCustom]

    def post(self, request, pk):
        try:
            story = Story.objects.get(author=request.user, id=pk)
        except Story.DoesNotExist:
            return Response({'error': 'Story not found'}, status=404)

        name = request.data.get('name', story.title)
        genre = request.data.get('genre', story.genre)
        summary = request.data.get('summary', story.summary)
        prompt = f"""Create an image of a {genre} story titled "{name}" with the following summary: "{summary}" """

        client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        response = client.images.generate(
            model="dall-e-3",
            prompt=prompt,
            size="1024x1024",
            quality="standard",
            n=1,
        )

        image_url = response.data[0].url

        # Download the image
        image_data = requests.get(image_url).content
        # You can adjust the name and extension
        image_name = f"{story.title}_image.png"

        # Save the image as a file using ImageField
        story.image.save(image_name, ContentFile(image_data), save=True)

        # Save the story object with the new image
        story.save()

        # Serializer
        serializer = StorySerializer(story)
        return Response(serializer.data)


class GenerateCharacterImageView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticatedCustom]

    def post(self, request, pk):
        try:
            character = Character.objects.get(id=pk)
        except Character.DoesNotExist:
            return Response({'error': 'Character not found'}, status=404)

        name = request.data.get('name', character.name)
        appearance = request.data.get('appearance', character.appearance)
        biography = request.data.get('biography', character.biography)
        prompt = f"""Create an image of a character named "{name}" with the following appearance: "{appearance}" and biography: "{biography}" """

        client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        response = client.images.generate(
            model="dall-e-3",
            prompt=prompt,
            size="1024x1024",
            quality="standard",
            n=1,
        )

        image_url = response.data[0].url

        # Download the image
        image_data = requests.get(image_url).content
        # You can adjust the name and extension
        image_name = f"{name}_image.png"

        # Update the character instance with the new image
        character.name = name
        character.appearance = appearance
        character.biography = biography

        # Save the image as a file using ImageField
        character.image.save(image_name, ContentFile(image_data), save=True)

        # Save the character object with the new image
        character.save()

        # Serializer
        serializer = ComplexCharacterSerializer(character)

        return Response(serializer.data)


class StoryGenerationView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticatedCustom]

    def post(self, request):
        step = int(request.data.get('step', 1))
        input_message = request.data.get('message')
        topic = request.data.get('topic', '')
        interview_questions = request.data.get('interview_questions', [])
        outline_result = request.data.get('outline_result', '')
        character_result = request.data.get('character_result', '')
        story_id = request.data.get('storyId', None)
        # find the story
        story = Story.objects.get(id=story_id)
        # get the genre of the story
        genre = story.genre
        print(f"Step: {step}")
        print(f"Genre: {genre}")
        print(f"Input Message: {input_message}")
        print(f"Topic: {topic}")
        print(f"Interview Questions: {interview_questions}")
        print(f"Outline Result: {outline_result}")
        print(f"Character Result: {character_result}")

        if step == 1:
            # Step 1: Interview Chain
            interview_chain = InterviewChain(topic=input_message, genre=genre)
            interview_questions_obj = interview_chain()
            interview_questions = [
                q.question for q in interview_questions_obj.questions
            ]
            return Response({
                'step': 2,
                'interview_questions': interview_questions,
                'topic': input_message
            })

        elif step == 2:
            # Step 2: Collect answers from user
            answers = request.data.get('answers', '').split("\n")
            print(f"Answers: {answers}")
            if not interview_questions:
                return Response({'error': 'Interview questions are missing.'}, status=400)
            if len(answers) != len(interview_questions):
                return Response({'error': 'The number of answers does not match the number of questions.'}, status=400)

            interview_data = [
                f"Q: {q}\nA: {a}" for q, a in zip(interview_questions, answers)
            ]
            print(interview_data)
            outline_generator = StoryOutlineGenerator(
                input=topic, genre=genre, interview_questions_and_answers=interview_data
            )
            outline_result = outline_generator.generate_outline()
            return Response({
                'step': 3,
                'outline_result': outline_result,
                'interview_questions': interview_data,
                'topic': topic,
            })
        elif step == 3:
            # Step 3: Character Generation
            character_generator = CharacterGenerator(
                input=topic, genre=genre, interview_questions_and_answers=interview_questions
            )
            character_result = character_generator.generate_character()
            print(type(character_result))
            # find the story
            story = Story.objects.get(id=story_id)

            for character in character_result.characters:
                character_info = {
                    'name': character.name,
                    'appearance': character.appearance,
                    'biography': character.biography
                }

                # Create and save the character for the current story
                character_to_save = Character(
                    story=story,
                    name=character_info['name'],
                    appearance=character_info['appearance'],
                    biography=character_info['biography']
                )
                character_to_save.save()
            return Response({
                'step': 4,
                'character_result': character_result,
                'outline_result': outline_result,
                'topic': topic
            })

        elif step == 4:
            # Step 4: Story Generation
            print(outline_result)
            story_gen = StoryGenerator(
                topic=topic, outline=outline_result,
                questions_and_answers=interview_questions, characters=character_result, genre=genre
            )
            stories = story_gen.generate_stories()
            # save the title and content and position to the database
            storyid = Story.objects.get(id=story_id)
            for index, story in enumerate(stories):
                chapters = outline_result[0][1]  # Get the list of chapters
                # Avoid reusing the name `chapter`
                for i, chapter_data in enumerate(chapters):
                    if i != index:
                        continue
                    title = chapter_data[1][1]
                content = story
                position = index + 1
                new_chapter = Chapter(title=title, content=content,  # Use a new variable name
                                      story=storyid, position=position)
                new_chapter.save()
            return Response({'step': 5, 'stories': stories})

        # elif step == 5:
        #     stories = request.session.get('stories')
        #     summarizer = StorySummarizer(story=stories)
        #     story_summary = summarizer.summarize_story()
        #     request.session['story_summary'] = story_summary
        #     request.session['step'] = 6
        #     return Response({'summary': request.session.get('story_summary')})

        # elif step == 6:
        #     # Step 7: Title Generation
        #     stories = request.session.get('stories')
        #     title_generator = TitleGenerator(summary=stories)
        #     candidate_titles = title_generator.generate_titles()
        #     request.session['candidate_titles'] = candidate_titles
        #     request.session['step'] = 1  # Reset for next process
        #     return Response({'titles': request.session.get('candidate_titles').titles})

        return Response({'error': 'Invalid step or action'}, status=400)
