import { director, Director, sys } from 'cc';

type BackHandler = () => boolean;
type SceneName =
    | 'Main'
    | 'CityExplore'
    | 'CharacterCustomization'
    | 'CharacterGallery'
    | 'VenueInterior'
    | 'ChallengeArena';

interface MiniProgramApi {
    exitMiniProgram?: (options?: Record<string, unknown>) => void;
}

class BackNavigationService {
    private handler: BackHandler | null = null;
    private originScene: SceneName | null = null;
    private loadingScene = false;
    private initialized = false;
    private historyArmed = false;
    private exiting = false;

    mount(handler: BackHandler): void {
        this.init();
        this.handler = handler;
        this.loadingScene = false;
        this.armHistory();
    }

    navigate(scene: SceneName): boolean {
        if (this.loadingScene) {
            return false;
        }
        const currentScene = director.getScene()?.name as SceneName | undefined;
        if (currentScene && currentScene !== scene) {
            this.originScene = currentScene;
        }
        this.loadingScene = true;
        director.once(Director.EVENT_AFTER_SCENE_LAUNCH, () => {
            this.loadingScene = false;
        });
        director.loadScene(scene);
        return true;
    }

    originOr(fallback: SceneName): SceneName {
        return this.originScene && this.originScene !== director.getScene()?.name
            ? this.originScene
            : fallback;
    }

    exitGame(): void {
        const wxApi = (globalThis as unknown as { wx?: MiniProgramApi }).wx;
        if (wxApi?.exitMiniProgram) {
            wxApi.exitMiniProgram();
            return;
        }
        if (typeof window === 'undefined' || typeof window.history?.go !== 'function') {
            return;
        }
        this.exiting = true;
        window.removeEventListener('popstate', this.onPopState);
        if (window.opener) {
            window.close();
            return;
        }
        window.history.go(-2);
    }

    private init(): void {
        if (
            this.initialized
            || typeof window === 'undefined'
            || typeof window.addEventListener !== 'function'
        ) {
            return;
        }
        this.initialized = true;
        window.addEventListener('popstate', this.onPopState);
        window.addEventListener('keydown', this.onKeyDown, true);
    }

    private armHistory(): void {
        if (
            this.historyArmed
            || typeof window === 'undefined'
            || typeof window.history?.pushState !== 'function'
            || this.exiting
        ) {
            return;
        }
        window.history.pushState(
            { ...(window.history.state ?? {}), lovermanBackGuard: true },
            '',
            window.location.href,
        );
        this.historyArmed = true;
    }

    private handleBack(): boolean {
        if (this.loadingScene || this.exiting) {
            return true;
        }
        if (!this.handler) {
            return false;
        }
        return this.handler();
    }

    private onPopState = (): void => {
        const handled = this.handleBack();
        if (!handled) {
            return;
        }
        this.historyArmed = false;
        this.armHistory();
    };

    private onKeyDown = (event: KeyboardEvent): void => {
        if (event.key !== 'Escape') {
            return;
        }
        if (this.handleBack()) {
            event.preventDefault();
            event.stopPropagation();
        }
    };
}

export const backNavigation = new BackNavigationService();
export function navigateTo(scene: SceneName): boolean {
    return backNavigation.navigate(scene);
}
