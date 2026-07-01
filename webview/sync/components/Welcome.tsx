import {Locale} from '../locales/ja';

type WelcomeProps = {message?: string};

export const Welcome = ({message = Locale.welcome}: WelcomeProps) =>
{
	return (
		<div className="welcome">
			<p>{message}</p>
		</div>
	);
};
