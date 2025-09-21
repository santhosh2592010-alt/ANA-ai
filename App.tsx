import React, { useState, useCallback } from 'react';
import { ReferenceImage } from './types';
import { generateConsistentCharacterImage } from './services/geminiService';

// --- Helper Functions ---
const fileToBase64 = (file: File): Promise<{ base64: string; mimeType: string }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const [mimePart, base64Part] = result.split(';base64,');
      if (!base64Part) {
        reject(new Error("Invalid file format"));
        return;
      }
      const mimeType = mimePart.split(':')[1];
      resolve({ base64: base64Part, mimeType });
    };
    reader.onerror = error => reject(error);
  });
};

// --- SVG Icon Components ---
const UploadIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l-3.75 3.75M12 9.75l3.75 3.75M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM21 21H3" />
  </svg>
);

const TrashIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.134-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.067-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
  </svg>
);

const SparklesIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.898 20.562L16.25 21.75l-.648-1.188a2.25 2.25 0 01-1.4-1.4l-1.188-.648 1.188-.648a2.25 2.25 0 011.4-1.4l.648-1.188.648 1.188a2.25 2.25 0 011.4 1.4l1.188.648-1.188.648a2.25 2.25 0 01-1.4 1.4z" />
    </svg>
);

const DownloadIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
    </svg>
);


// --- UI Components ---

interface ImageUploaderProps {
  images: ReferenceImage[];
  onImagesChange: (images: ReferenceImage[]) => void;
  onError: (message: string | null) => void;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ images, onImagesChange, onError }) => {
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    onError(null);
    const files = Array.from(event.target.files || []);
    const newImages: ReferenceImage[] = [];
    const allowedTypes = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
    const invalidFiles: string[] = [];

    for (const file of files) {
      if (file instanceof File) {
        if (allowedTypes.includes(file.type)) {
            try {
              const { base64, mimeType } = await fileToBase64(file);
              newImages.push({ base64, mimeType, name: file.name });
            } catch (error) {
              console.error("Error converting file:", error);
              onError("Error processing image file. Please try another file.");
              return;
            }
        } else {
            invalidFiles.push(file.name);
        }
      }
    }

    if (invalidFiles.length > 0) {
        onError(`Unsupported file type(s): ${invalidFiles.join(', ')}. Please use PNG, JPEG, WEBP, or GIF.`);
    }

    if (newImages.length > 0) {
        onImagesChange([...images, ...newImages]);
    }

    event.target.value = ''; // Allow re-uploading the same file
  };

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <label htmlFor="file-upload" className="relative cursor-pointer bg-slate-800 border-2 border-dashed border-slate-600 rounded-lg p-8 flex flex-col justify-center items-center hover:bg-slate-700 hover:border-sky-500 transition-colors duration-200">
        <UploadIcon className="w-12 h-12 text-slate-500" />
        <span className="mt-2 block text-sm font-semibold text-slate-400">Upload Reference Images</span>
        <span className="block text-xs text-slate-500">PNG, JPG, WEBP, GIF up to 10MB</span>
        <input id="file-upload" name="file-upload" type="file" multiple className="sr-only" onChange={handleFileChange} accept="image/png,image/jpeg,image/webp,image/gif" />
      </label>
      {images.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative group aspect-square">
              <img src={`data:${image.mimeType};base64,${image.base64}`} alt={image.name} className="object-cover w-full h-full rounded-md" />
              <button
                onClick={() => removeImage(index)}
                className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Remove image"
              >
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

interface GeneratedImageDisplayProps {
    image: string | null;
    text: string | null;
    isLoading: boolean;
}

const GeneratedImageDisplay: React.FC<GeneratedImageDisplayProps> = ({ image, text, isLoading }) => {
    const Loader: React.FC = () => (
        <div className="flex flex-col items-center justify-center h-full">
            <svg className="animate-spin h-12 w-12 text-sky-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="mt-4 text-slate-400">Generating your masterpiece...</p>
        </div>
    );

    const Placeholder: React.FC = () => (
        <div className="flex flex-col items-center justify-center h-full text-center text-slate-500 p-8">
            <SparklesIcon className="w-20 h-20 mb-4 text-slate-600" />
            <h3 className="text-xl font-bold text-slate-400">Your Creation Awaits</h3>
            <p className="mt-2">Upload reference images and write a prompt to generate a new scene.</p>
        </div>
    );

    const handleDownload = useCallback(() => {
        if (!image) return;
        const link = document.createElement('a');
        link.href = image;
        const mimeType = image.split(';')[0].split(':')[1];
        const extension = mimeType ? mimeType.split('/')[1] : 'png';
        link.download = `ana-ai-generated.${extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [image]);

    if (isLoading) return <Loader />;
    if (!image && !text) return <Placeholder />;

    return (
        <div className="space-y-6 w-full">
            {image && (
                <div className="relative group bg-black/20 rounded-lg overflow-hidden shadow-lg">
                    <img src={image} alt="Generated character" className="w-full h-auto object-contain" />
                    <button
                        onClick={handleDownload}
                        className="absolute top-2 right-2 bg-slate-900/70 text-white rounded-full p-2 hover:bg-sky-500 transition-colors duration-200 opacity-0 group-hover:opacity-100 focus:opacity-100"
                        aria-label="Download image"
                    >
                        <DownloadIcon className="w-5 h-5" />
                    </button>
                </div>
            )}
            {text && (
                <div className="bg-slate-800 p-4 rounded-lg">
                    <p className="text-slate-300 whitespace-pre-wrap">{text}</p>
                </div>
            )}
        </div>
    );
};


// --- Main App Component ---

export default function App() {
  const [referenceImages, setReferenceImages] = useState<ReferenceImage[]>([]);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedText, setGeneratedText] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!prompt || referenceImages.length === 0) {
      setError("Please provide at least one reference image and a prompt.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setGeneratedImage(null);
    setGeneratedText(null);

    try {
      const result = await generateConsistentCharacterImage(prompt, referenceImages);
      setGeneratedImage(result.image);
      setGeneratedText(result.text);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  }, [prompt, referenceImages]);

  const isGenerateDisabled = isLoading || !prompt || referenceImages.length === 0;

  return (
    <div className="min-h-screen bg-slate-900 font-sans">
        <header className="bg-slate-900/70 backdrop-blur-lg sticky top-0 z-10 border-b border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center h-16">
                 <h1 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-blue-600">
                    ANA.ai
                 </h1>
            </div>
        </header>

      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="text-center mb-10">
          <p className="mt-3 text-lg text-slate-400 max-w-2xl mx-auto">
            Your personal AI for consistent character creation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {/* Left Panel: Controls */}
          <div className="bg-slate-800/50 p-6 rounded-xl shadow-2xl border border-slate-700 flex flex-col space-y-6 h-fit">
            <div>
              <label className="text-lg font-semibold text-slate-200 block mb-2">1. Reference Images</label>
              <ImageUploader images={referenceImages} onImagesChange={setReferenceImages} onError={setError} />
            </div>
            
            <div>
                <label htmlFor="prompt-input" className="text-lg font-semibold text-slate-200 block mb-2">2. Prompt</label>
                <textarea
                    id="prompt-input"
                    rows={4}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-md p-3 text-slate-300 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition resize-none placeholder-slate-500"
                    placeholder="e.g., character is drinking coffee in a Parisian cafe"
                />
            </div>
            
            {error && <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-md text-sm">{error}</div>}

            <button
                onClick={handleGenerate}
                disabled={isGenerateDisabled}
                className={`w-full flex items-center justify-center gap-2 text-lg font-bold py-3 px-6 rounded-lg transition-all duration-200 ease-in-out
                    ${isGenerateDisabled 
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                    : 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white hover:from-sky-600 hover:to-indigo-700 shadow-lg hover:shadow-sky-500/30 transform hover:-translate-y-0.5'
                }`}
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Generating...
                </>
              ) : (
                <>
                  <SparklesIcon className="w-6 h-6" />
                  Generate
                </>
              )}
            </button>
          </div>

          {/* Right Panel: Output */}
          <div className="bg-slate-800/50 p-6 rounded-xl shadow-2xl border border-slate-700 min-h-[400px] flex items-center justify-center">
            <GeneratedImageDisplay image={generatedImage} text={generatedText} isLoading={isLoading} />
          </div>
        </div>
      </main>
    </div>
  );
}
