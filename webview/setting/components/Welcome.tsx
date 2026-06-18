import {Locale} from '../locales/ja';

type WelcomeProps = {message?: string};

export const Welcome = ({message = Locale.pleaseOpenContent}: WelcomeProps) => <div className="welcome">
	<p>{message}</p>
</div>;
